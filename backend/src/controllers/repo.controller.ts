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
    githubToken: getHeaderString(req.headers['x-github-token'])
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
      githubToken: getHeaderString(req.headers['x-github-token'])
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
    githubToken: getHeaderString(req.headers['x-github-token'])
  });
  res.json({ scan });
}

export async function applyPatch(req: AuthenticatedRequest, res: Response) {
  const findingId = String(req.params.findingId);
  const user = req.user;

  try {
    const updatedScan = await applyFindingPatch(findingId);

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
