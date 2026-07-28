import { Request, Response } from 'express';
import { getLatestRepoScan, executeRepoScan, applyFindingPatch } from '../services/repo-scanner.service.js';

export async function getRepository(req: Request, res: Response) {
  const latestScan = await getLatestRepoScan();
  res.json({
    repository: {
      id: 'opspilot-demo-repo',
      name: 'company/production-backend-api',
      url: 'https://github.com/company/production-backend-api',
      defaultBranch: 'main',
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
