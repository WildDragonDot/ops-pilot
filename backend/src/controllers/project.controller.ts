import { Request, Response } from 'express';
import { prisma } from '../services/db.service.js';
import { getProjectState, injectFailureScenario, resetEnvironmentState } from '../services/incident-agent.service.js';

export async function getProject(req: Request, res: Response) {
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

export function getProjectHealth(req: Request, res: Response) {
  const state = getProjectState();
  res.json({
    status: state.environmentStatus.overall,
    services: state.environmentStatus,
    timestamp: new Date().toISOString()
  });
}

export function injectFailure(req: Request, res: Response) {
  const { scenarioKey } = req.body;
  const state = injectFailureScenario(scenarioKey || 'DATABASE_STOPPED');
  res.json({ success: true, services: state.environmentStatus });
}

export function resetEnv(req: Request, res: Response) {
  const state = resetEnvironmentState();
  res.json({ success: true, services: state.environmentStatus });
}
