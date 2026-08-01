import { Request, Response } from 'express';
import { prisma } from '../services/db.service.js';
import { getLatestRepoScan, executeRepoScan, applyFindingPatch } from '../services/repo-scanner.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { writeAuditLog } from '../services/audit-log.service.js';

function getIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  const first = Array.isArray(fwd) ? fwd[0] : fwd;
  return (first?.split(',')[0]?.trim() || String(req.ip || '') || 'unknown').replace('::ffff:', '');
}

const getHeaderString = (val: string | string[] | undefined): string | undefined => {
  if (!val) return undefined;
  const str = Array.isArray(val) ? val[0] : val;
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
};

export async function getRepository(req: AuthenticatedRequest, res: Response) {
  const projectId = req.query.projectId ? String(req.query.projectId) : undefined;
  const latestScan = await getLatestRepoScan({
    projectId,
    githubToken: getHeaderString(req.headers['x-github-token']),
    userOpenAIKey: getHeaderString(req.headers['x-openai-api-key'])
  });
  const repository = latestScan?.repositoryId
    ? await prisma.repository.findUnique({ where: { id: latestScan.repositoryId } })
    : null;
  res.json({
    repository: {
      id: repository?.id || 'workspace-local-repo',
      name: repository?.name || 'Local Workspace Repository',
      url: repository?.url || 'local-workspace',
      defaultBranch: repository?.defaultBranch || 'main',
      lastScannedAt: latestScan?.completedAt,
      latestScan
    }
  });
}

export async function triggerScan(req: AuthenticatedRequest, res: Response) {
  const user = req.user;
  const projectId = req.body?.projectId ? String(req.body.projectId) : undefined;

  try {
    const scan = await executeRepoScan({
      projectId,
      githubToken: getHeaderString(req.headers['x-github-token']),
      userOpenAIKey: getHeaderString(req.headers['x-openai-api-key'])
    });

    // Audit: repository scan triggered
    if (user) {
      const score = scan?.overallScore ?? 0;
      const grade = score >= 90 ? 'A+' : score >= 75 ? 'B+' : 'C';
      await writeAuditLog({
        orgId: user.organizationId,
        userId: user.userId,
        userEmail: user.email,
        userName: user.email,
        action: 'TRIGGERED_REPO_SCAN',
        category: 'SCAN',
        target: projectId ? `Project #${projectId}` : 'Global Repository',
        ipAddress: getIp(req),
        status: 'SUCCESS',
        details: `Repository scan completed — Overall Score: ${scan?.overallScore ?? 'N/A'}/100 Grade ${grade} — Findings: ${scan?.findings?.length ?? 0}`
      });
    }

    res.json({ scan });
  } catch (err: any) {
    if (user) {
      await writeAuditLog({
        orgId: user.organizationId,
        userId: user.userId,
        userEmail: user.email,
        userName: user.email,
        action: 'TRIGGERED_REPO_SCAN',
        category: 'SCAN',
        target: projectId ? `Project #${projectId}` : 'Global Repository',
        ipAddress: getIp(req),
        status: 'FAILED',
        details: `Scan failed: ${err.message}`
      });
    }
    res.status(500).json({ error: err.message });
  }
}

export async function getScanById(req: AuthenticatedRequest, res: Response) {
  const scan = await getLatestRepoScan({
    projectId: req.query.projectId ? String(req.query.projectId) : undefined,
    githubToken: getHeaderString(req.headers['x-github-token']),
    userOpenAIKey: getHeaderString(req.headers['x-openai-api-key'])
  });
  res.json({ scan });
}

export async function applyPatch(req: AuthenticatedRequest, res: Response) {
  const findingId = String(req.params.findingId);
  const user = req.user;
  const headerGitToken = getHeaderString(req.headers['x-github-token']);

  try {
    const updatedScan = await applyFindingPatch(findingId, headerGitToken);

    // Audit: security patch applied
    if (user) {
      await writeAuditLog({
        orgId: user.organizationId,
        userId: user.userId,
        userEmail: user.email,
        userName: user.email,
        action: 'APPLIED_SECURITY_PATCH',
        category: 'CODE_PATCH',
        target: `Finding #${findingId}`,
        ipAddress: getIp(req),
        status: 'SUCCESS',
        details: `Security patch applied by ${user.email} (role: ${user.role}) — Scan updated`
      });
    }

    res.json({ success: true, message: 'Patch applied and persisted to DB', scan: updatedScan });
  } catch (err: any) {
    if (user) {
      await writeAuditLog({
        orgId: user.organizationId,
        userId: user.userId,
        userEmail: user.email,
        userName: user.email,
        action: 'APPLIED_SECURITY_PATCH',
        category: 'CODE_PATCH',
        target: `Finding #${findingId}`,
        ipAddress: getIp(req),
        status: 'FAILED',
        details: `Patch failed: ${err.message}`
      });
    }
    res.status(400).json({ error: err.message });
  }
}

export async function commitAndPushChanges(req: AuthenticatedRequest, res: Response) {
  const user = req.user;
  const { projectId, customCommitMessage } = req.body || {};
  const commitMsg = customCommitMessage || 'fix(ai): commit and push AI applied security & bug fixes';
  const headerGitToken = getHeaderString(req.headers['x-github-token']);

  try {
    let repoPath = process.cwd();
    let gitUrl = '';
    let targetBranch = 'main';
    let gitToken = '';

    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: String(projectId) } });
      if (project) {
        gitUrl = project.gitUrl || '';
        targetBranch = (project as any).gitBranch || 'main';
        gitToken = (project as any).gitToken || '';

        const effectiveToken = headerGitToken || gitToken || process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN;

        const { cloneOrSyncRepository } = await import('../services/repo-clone.service.js');
        const cloneResult = await cloneOrSyncRepository(
          project.id,
          gitUrl,
          targetBranch,
          effectiveToken || undefined
        ).catch(() => null);
        if (cloneResult?.repoPath) {
          repoPath = cloneResult.repoPath;
        }
      }
    }

    const { execFileSync } = await import('child_process');

    if (!gitUrl && repoPath) {
      try {
        const remoteUrl = execFileSync('git', ['config', '--get', 'remote.origin.url'], { cwd: repoPath, encoding: 'utf-8' }).trim();
        if (remoteUrl) gitUrl = remoteUrl;
      } catch (e) {}
    }

    const statusOutput = execFileSync('git', ['status', '--porcelain'], { cwd: repoPath, encoding: 'utf-8' });

    if (!statusOutput.trim()) {
      return res.json({
        success: true,
        message: 'No uncommitted AI changes detected. Repository working tree is clean.',
        alreadyClean: true
      });
    }

    // Stage all modified/new files
    execFileSync('git', ['add', '.'], { cwd: repoPath });

    // Commit changes with fallback author
    execFileSync(
      'git',
      ['-c', 'user.name=OpsPilot AI Agent', '-c', 'user.email=ai-agent@opspilot.local', 'commit', '-m', commitMsg],
      { cwd: repoPath }
    );

    // Push changes with authenticated token URL
    const pushToken = headerGitToken || gitToken || process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN;
    
    let pushTarget = gitUrl;
    if (pushTarget && pushToken && pushTarget.startsWith('https://')) {
      const cleanUrl = pushTarget.replace(/^https:\/\//, '').replace(/^.*@/, '');
      pushTarget = `https://${pushToken}@${cleanUrl}`;
    }

    try {
      if (pushTarget && pushToken) {
        execFileSync('git', ['push', pushTarget, targetBranch], { 
          cwd: repoPath,
          env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
        });
      } else {
        execFileSync('git', ['push', 'origin', targetBranch], { 
          cwd: repoPath,
          env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
        });
      }
    } catch (pushErr: any) {
      const pushMsg = pushErr?.stderr?.toString() || pushErr?.message || '';
      if (!pushToken || pushMsg.includes('Could not read Username') || pushMsg.includes('terminal prompts disabled') || pushMsg.includes('Authentication failed')) {
        return res.status(400).json({
          success: false,
          requiresToken: true,
          error: 'GitHub Personal Access Token is required to push code. Please configure your GitHub token in Vault / Settings.',
          message: 'GitHub Personal Access Token is required to push code. Please configure your GitHub token in Vault / Settings.'
        });
      }
      throw pushErr;
    }

    if (user) {
      await writeAuditLog({
        orgId: user.organizationId,
        userId: user.userId,
        userEmail: user.email,
        userName: user.email,
        action: 'COMMITTED_AND_PUSHED_AI_CHANGES',
        category: 'CODE_PATCH',
        target: projectId ? `Project #${projectId}` : 'Global Repository',
        ipAddress: getIp(req),
        status: 'SUCCESS',
        details: `AI code changes committed ("${commitMsg}") and pushed to branch ${targetBranch} by ${user.email}`
      });
    }

    res.json({
      success: true,
      message: `AI code changes committed & successfully pushed to branch ${targetBranch}!`,
      commitMessage: commitMsg
    });
  } catch (err: any) {
    if (user) {
      await writeAuditLog({
        orgId: user.organizationId,
        userId: user.userId,
        userEmail: user.email,
        userName: user.email,
        action: 'COMMITTED_AND_PUSHED_AI_CHANGES',
        category: 'CODE_PATCH',
        target: projectId ? `Project #${projectId}` : 'Global Repository',
        ipAddress: getIp(req),
        status: 'FAILED',
        details: `Git commit/push failed: ${err.message}`
      });
    }
    res.status(500).json({ error: err.message || 'Failed to commit and push AI changes' });
  }
}

