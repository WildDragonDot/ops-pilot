import { getLatestRepoScan, executeRepoScan } from '../services/repo-scanner.service.js';
export async function getRepository(req, res) {
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
export async function triggerScan(req, res) {
    const scan = await executeRepoScan();
    res.json({ scan });
}
export async function getScanById(req, res) {
    const scan = await getLatestRepoScan();
    res.json({ scan });
}
