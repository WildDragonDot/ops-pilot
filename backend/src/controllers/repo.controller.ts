import { Request, Response } from 'express';
import { getLatestRepoScan, executeRepoScan } from '../services/repo-scanner.service.js';

export async function getRepository(req: Request, res: Response) {
  const latestScan = await getLatestRepoScan();
  res.json({
    repository: {
      id: 'opspilot-demo-repo',
      name: 'company/production-backend-api',
      url: 'https://github.com/company/production-backend-api',
      defaultBranch: 'main',
      lastScannedAt: latestScan.completedAt,
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
