import { Request, Response } from 'express';
import { 
  createAndRunIncident, 
  getAllIncidents, 
  getIncidentById, 
  incidentEmitter 
} from '../services/incident-agent.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { writeAuditLog } from '../services/audit-log.service.js';

function getIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  const first = Array.isArray(fwd) ? fwd[0] : fwd;
  return (first?.split(',')[0]?.trim() || String(req.ip || '') || 'unknown').replace('::ffff:', '');
}

export async function createIncident(req: AuthenticatedRequest, res: Response) {
  const { userPrompt, scenarioKey, projectId } = req.body;
  const user = req.user;
  try {
    const incident = await createAndRunIncident(userPrompt, scenarioKey, projectId);

    // Write audit log — incident investigation triggered
    if (user) {
      await writeAuditLog({
        orgId: user.organizationId,
        userId: user.userId,
        userEmail: user.email,
        userName: user.email,
        action: 'TRIGGERED_INCIDENT_INVESTIGATION',
        category: 'INCIDENT',
        target: `Incident #${incident.id}`,
        ipAddress: getIp(req),
        status: 'SUCCESS',
        details: `Prompt: "${userPrompt?.slice(0, 200)}" — Scenario: ${scenarioKey || 'auto-detect'} — Project: ${projectId || 'global'}`
      });
    }

    res.json({ incident });
  } catch (err: any) {
    // Log failed incident creation attempt
    if (user) {
      await writeAuditLog({
        orgId: user.organizationId,
        userId: user.userId,
        userEmail: user.email,
        userName: user.email,
        action: 'TRIGGERED_INCIDENT_INVESTIGATION',
        category: 'INCIDENT',
        target: `Incident [FAILED]`,
        ipAddress: getIp(req),
        status: 'FAILED',
        details: `Error: ${err.message} — Prompt: "${userPrompt?.slice(0, 100)}"`
      });
    }
    res.status(400).json({ error: err.message || 'Unable to create incident.' });
  }
}

export async function getIncidents(req: Request, res: Response) {
  const projectId = req.query.projectId as string | undefined;
  const incidents = await getAllIncidents(projectId);
  res.json({ incidents });
}

export async function getIncident(req: Request, res: Response) {
  const incident = await getIncidentById(String(req.params.id));
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }
  res.json({ incident });
}

export async function streamIncident(req: Request, res: Response) {
  const incidentId = String(req.params.id);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const onUpdate = (updated: any) => {
    res.write(`data: ${JSON.stringify(updated)}\n\n`);
  };

  incidentEmitter.on(`incident_update_${incidentId}`, onUpdate);

  const incident = await getIncidentById(incidentId);
  if (incident) {
    res.write(`data: ${JSON.stringify(incident)}\n\n`);
  }

  req.on('close', () => {
    incidentEmitter.off(`incident_update_${incidentId}`, onUpdate);
  });
}

export async function getReport(req: Request, res: Response) {
  const incident = await getIncidentById(String(req.params.id));
  if (!incident || !incident.report) {
    return res.status(404).json({ error: 'Report not available yet' });
  }
  res.json({ report: incident.report });
}
