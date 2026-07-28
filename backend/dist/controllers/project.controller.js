import { prisma } from '../services/db.service.js';
import { getProjectState, injectFailureScenario, resetEnvironmentState, createAndRunIncident } from '../services/incident-agent.service.js';
export async function getProject(req, res) {
    let project = await prisma.project.findFirst({
        include: { repositories: true }
    });
    const state = getProjectState();
    if (!project) {
        project = await prisma.project.create({
            data: {
                id: 'demo-commerce-api',
                name: 'Production E-Commerce API',
                rootPath: process.cwd(),
                runtimeType: 'Docker Compose'
            },
            include: { repositories: true }
        });
    }
    res.json({
        project: {
            ...project,
            environmentStatus: state.environmentStatus
        }
    });
}
export function getProjectHealth(req, res) {
    const state = getProjectState();
    res.json({
        status: state.environmentStatus.overall,
        services: state.environmentStatus,
        timestamp: new Date().toISOString()
    });
}
export async function injectFailure(req, res) {
    const { scenarioKey } = req.body;
    const key = scenarioKey || 'DATABASE_STOPPED';
    const state = injectFailureScenario(key);
    const incident = await createAndRunIncident('', key);
    res.json({ success: true, services: state.environmentStatus, incident });
}
export function resetEnv(req, res) {
    const state = resetEnvironmentState();
    res.json({ success: true, services: state.environmentStatus });
}
