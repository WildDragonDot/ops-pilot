import { Request, Response } from 'express';
import { prisma } from '../services/db.service.js';
import { getLatestRepoScan, executeRepoScan, applyFindingPatch } from '../services/repo-scanner.service.js';

export async function getRepository(req: Request, res: Response) {
  const latestScan = await getLatestRepoScan();
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

export async function triggerScan(req: Request, res: Response) {
  const scan = await executeRepoScan();
  res.json({ scan });
}

export async function getScanById(req: Request, res: Response) {
  const scan = await getLatestRepoScan();
  res.json({ scan });
}

export async function applyPatch(req: Request, res: Response) {
  const findingId = String(req.params.findingId);
  try {
    const updatedScan = await applyFindingPatch(findingId);
    res.json({ success: true, message: 'Patch applied and persisted to DB', scan: updatedScan });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
