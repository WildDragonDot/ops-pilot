import { prisma } from '../services/db.service.js';
import { getLatestRepoScan, executeRepoScan, applyFindingPatch } from '../services/repo-scanner.service.js';
const getHeaderString = (val) => {
    if (!val)
        return undefined;
    const str = Array.isArray(val) ? val[0] : val;
    try {
        return decodeURIComponent(str);
    }
    catch {
        return str;
    }
};
export async function getRepository(req, res) {
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
export async function triggerScan(req, res) {
    const scan = await executeRepoScan({
        projectId: req.body?.projectId ? String(req.body.projectId) : undefined,
        githubToken: getHeaderString(req.headers['x-github-token'])
    });
    res.json({ scan });
}
export async function getScanById(req, res) {
    const scan = await getLatestRepoScan({
        projectId: req.query.projectId ? String(req.query.projectId) : undefined,
        githubToken: getHeaderString(req.headers['x-github-token'])
    });
    res.json({ scan });
}
export async function applyPatch(req, res) {
    const findingId = String(req.params.findingId);
    try {
        const updatedScan = await applyFindingPatch(findingId);
        res.json({ success: true, message: 'Patch applied and persisted to DB', scan: updatedScan });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
