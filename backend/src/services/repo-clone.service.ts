import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { logger } from './logger.service.js';
import { prisma } from './db.service.js';

const CLONE_BASE_DIR = path.join(process.cwd(), 'data', 'cloned_repos');

interface CloneMetadata {
  projectId: string;
  gitUrl: string;
  branch: string;
  lastAccessedAt: string;
}

function ensureBaseDirExists() {
  if (!fs.existsSync(CLONE_BASE_DIR)) {
    fs.mkdirSync(CLONE_BASE_DIR, { recursive: true });
  }
}

/**
 * Format GitHub URL with access token if available
 */
function getAuthenticatedGitUrl(gitUrl: string, token?: string): string {
  if (!token) return gitUrl;
  const cleanUrl = gitUrl.replace(/^https:\/\//, '');
  return `https://${token}@${cleanUrl}`;
}

/**
 * Clone or sync a GitHub repository locally on the server for AST auditing.
 * Checks out the specified branch and pulls latest commits if new code arrived.
 */
export async function cloneOrSyncRepository(
  projectId: string,
  gitUrl: string,
  branch: string = 'main',
  githubToken?: string
): Promise<{ success: boolean; repoPath: string; message: string; updated: boolean }> {
  ensureBaseDirExists();
  const repoDir = path.join(CLONE_BASE_DIR, projectId);
  const metaFile = path.join(repoDir, '.opspilot_meta.json');
  const authGitUrl = getAuthenticatedGitUrl(gitUrl, githubToken);

  const saveMetadata = (b: string) => {
    try {
      const meta: CloneMetadata = {
        projectId,
        gitUrl,
        branch: b,
        lastAccessedAt: new Date().toISOString()
      };
      fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2), 'utf-8');
    } catch (e) {
      // Non-fatal
    }
  };

  try {
    if (fs.existsSync(repoDir)) {
      // Repository directory exists - Sync & pull latest branch updates
      logger.info(`🔄 Existing clone found for project ${projectId}. Syncing branch "${branch}"...`);
      
      try {
        // Verify git worktree
        execSync('git rev-parse --is-inside-work-tree', { cwd: repoDir, stdio: 'ignore' });
        
        // Fetch remote updates
        execSync('git fetch origin', { cwd: repoDir, stdio: 'ignore', timeout: 30000 });
        
        // Checkout target branch and pull latest code
        execSync(`git checkout ${branch}`, { cwd: repoDir, stdio: 'ignore' });
        execSync(`git pull origin ${branch}`, { cwd: repoDir, stdio: 'ignore', timeout: 30000 });
        
        saveMetadata(branch);
        logger.info(`✅ Successfully updated repository ${projectId} on branch "${branch}" to latest commit.`);
        return {
          success: true,
          repoPath: repoDir,
          message: `Repository synced and updated to latest commit on branch "${branch}".`,
          updated: true
        };
      } catch (syncErr: any) {
        logger.warn(`⚠️ Git sync failed for ${projectId}. Re-cloning repository... Reason: ${syncErr?.message}`);
        fs.rmSync(repoDir, { recursive: true, force: true });
      }
    }

    // Fresh Git Clone
    logger.info(`📥 Cloning repository ${gitUrl} (branch: ${branch}) for project ${projectId}...`);
    execSync(`git clone --depth 1 --branch ${branch} "${authGitUrl}" "${repoDir}"`, {
      stdio: 'ignore',
      timeout: 60000
    });

    saveMetadata(branch);
    logger.info(`✅ Successfully cloned repository for project ${projectId} into local server workspace.`);

    return {
      success: true,
      repoPath: repoDir,
      message: `Repository cloned successfully on branch "${branch}".`,
      updated: false
    };
  } catch (err: any) {
    logger.error(`❌ Failed to clone or sync repository ${gitUrl}:`, err?.message || err);
    return {
      success: false,
      repoPath: repoDir,
      message: `Git clone failed: ${err?.message || 'Network error or private repository authentication required.'}`,
      updated: false
    };
  }
}

/**
 * Automatically purges cloned repository directories from server disk storage if:
 * 1. The repository clone has not been accessed for > maxAgeDays (default: 3 days).
 * 2. Or the associated user/project has been inactive for > 3 days.
 */
export async function cleanupInactiveClonedRepos(maxAgeDays: number = 3): Promise<{ purgedCount: number; purgedProjects: string[] }> {
  ensureBaseDirExists();
  const now = Date.now();
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  const purgedProjects: string[] = [];

  try {
    const entries = fs.readdirSync(CLONE_BASE_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const projectId = entry.name;
      const repoDir = path.join(CLONE_BASE_DIR, projectId);
      const metaFile = path.join(repoDir, '.opspilot_meta.json');

      let lastAccessTime = 0;

      // Check metadata last access timestamp
      if (fs.existsSync(metaFile)) {
        try {
          const meta: CloneMetadata = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
          lastAccessTime = new Date(meta.lastAccessedAt).getTime();
        } catch (e) {
          lastAccessTime = fs.statSync(repoDir).mtimeMs;
        }
      } else {
        lastAccessTime = fs.statSync(repoDir).mtimeMs;
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId }
      }).catch(() => null);

      if (project?.updatedAt) {
        const projectActivityTime = new Date(project.updatedAt).getTime();
        lastAccessTime = Math.max(lastAccessTime, projectActivityTime);
      }

      const inactiveDurationMs = now - lastAccessTime;
      const inactiveDays = (inactiveDurationMs / (24 * 60 * 60 * 1000)).toFixed(1);

      if (inactiveDurationMs > maxAgeMs) {
        logger.info(`🧹 Auto-purging inactive cloned repo for project ${projectId} (Inactive for ${inactiveDays} days)...`);
        fs.rmSync(repoDir, { recursive: true, force: true });
        purgedProjects.push(projectId);
      }
    }

    if (purgedProjects.length > 0) {
      logger.info(`✅ Auto-purged ${purgedProjects.length} inactive cloned repository workspace(s) from server storage.`);
    }
  } catch (err: any) {
    logger.warn('⚠️ Error during cloned repo cleanup cron:', err?.message || err);
  }

  return {
    purgedCount: purgedProjects.length,
    purgedProjects
  };
}
