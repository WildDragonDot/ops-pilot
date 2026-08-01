import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from './logger.service.js';
import { prisma } from './db.service.js';

const execAsync = promisify(exec);
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

  // Validate branch name to prevent command injection
  const BRANCH_PATTERN = /^[a-zA-Z0-9._\-/]+$/;
  if (!BRANCH_PATTERN.test(branch)) {
    return { success: false, repoPath: '', message: `Invalid branch name: "${branch}"`, updated: false };
  }
  const safeBranch = branch;

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
      logger.info(`🔄 Existing clone found for project ${projectId}. Syncing branch "${branch}"...`);
      try {
        // Verify git worktree
        await execAsync('git rev-parse --is-inside-work-tree', { cwd: repoDir });
        // Fetch & pull latest
        await execAsync('git fetch origin', { cwd: repoDir, timeout: 30000 });
        await execAsync(`git checkout ${safeBranch}`, { cwd: repoDir });
        await execAsync(`git pull origin ${safeBranch}`, { cwd: repoDir, timeout: 30000 });
        saveMetadata(branch);
        logger.info(`✅ Successfully updated repository ${projectId} on branch "${branch}" to latest commit.`);
        return { success: true, repoPath: repoDir, message: `Repository synced to latest commit on branch "${branch}".`, updated: true };
      } catch (syncErr: any) {
        logger.warn(`⚠️ Git sync failed for ${projectId}. Re-cloning... Reason: ${syncErr?.message}`);
        fs.rmSync(repoDir, { recursive: true, force: true });
      }
    }

    // Fresh clone
    logger.info(`📥 Cloning repository ${gitUrl} (branch: ${branch}) for project ${projectId}...`);
    await execAsync(`git clone --depth 1 --branch ${safeBranch} "${authGitUrl}" "${repoDir}"`, { timeout: 60000 });
    saveMetadata(branch);
    logger.info(`✅ Successfully cloned repository for project ${projectId}.`);
    return { success: true, repoPath: repoDir, message: `Repository cloned on branch "${branch}".`, updated: false };
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
 * Instantly deletes the local cloned repository folder for a specific project from disk storage.
 */
export function deleteClonedRepo(projectId: string): boolean {
  try {
    const repoDir = path.join(CLONE_BASE_DIR, projectId);
    if (fs.existsSync(repoDir)) {
      fs.rmSync(repoDir, { recursive: true, force: true });
      logger.info(`🗑️ Deleted local cloned repository folder for project ${projectId}`);
      return true;
    }
  } catch (err: any) {
    logger.warn(`⚠️ Failed to remove local cloned repository for project ${projectId}:`, err?.message || err);
  }
  return false;
}

/**
 * Automatically purges cloned repository directories from server disk storage if:
 * 1. The associated project has been deleted from the database.
 * 2. Or the repository clone has not been accessed for > maxAgeDays (default: 3 days).
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

      if (!project) {
        logger.info(`🧹 Auto-purging orphaned cloned repo for deleted project ${projectId}...`);
        fs.rmSync(repoDir, { recursive: true, force: true });
        purgedProjects.push(projectId);
        continue;
      }

      if (project.updatedAt) {
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
