import { Request, Response } from 'express';
import { getProjectState, injectFailureScenario, resetEnvironmentState } from '../services/incident-agent.service.js';

export function getProject(req: Request, res: Response) {
  const project = getProjectState();
  res.json({ project });
}

export function getProjectHealth(req: Request, res: Response) {
  const project = getProjectState();
  res.json({
    status: project.environmentStatus.overall,
    services: project.environmentStatus,
    timestamp: new Date().toISOString()
  });
}

export function injectFailure(req: Request, res: Response) {
  const { scenarioKey } = req.body;
  const project = injectFailureScenario(scenarioKey || 'DATABASE_STOPPED');
  res.json({ success: true, project });
}

export function resetEnv(req: Request, res: Response) {
  const project = resetEnvironmentState();
  res.json({ success: true, project });
}
