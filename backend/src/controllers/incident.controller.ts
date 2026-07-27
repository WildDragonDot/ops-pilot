import { Request, Response } from 'express';
import { 
  createAndRunIncident, 
  getAllIncidents, 
  getIncidentById, 
  incidentEmitter 
} from '../services/incident-agent.service.js';

export async function createIncident(req: Request, res: Response) {
  const { userPrompt, scenarioKey } = req.body;
  const incident = await createAndRunIncident(userPrompt, scenarioKey);
  res.json({ incident });
}

export function getIncidents(req: Request, res: Response) {
  const incidents = getAllIncidents();
  res.json({ incidents });
}

export function getIncident(req: Request, res: Response) {
  const incident = getIncidentById(String(req.params.id));
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }
  res.json({ incident });
}

export function streamIncident(req: Request, res: Response) {
  const incidentId = String(req.params.id);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const onUpdate = (updated: any) => {
    res.write(`data: ${JSON.stringify(updated)}\n\n`);
  };

  incidentEmitter.on(`incident_update_${incidentId}`, onUpdate);

  const incident = getIncidentById(incidentId);
  if (incident) {
    res.write(`data: ${JSON.stringify(incident)}\n\n`);
  }

  req.on('close', () => {
    incidentEmitter.off(`incident_update_${incidentId}`, onUpdate);
  });
}

export function getReport(req: Request, res: Response) {
  const incident = getIncidentById(String(req.params.id));
  if (!incident || !incident.report) {
    return res.status(404).json({ error: 'Report not available yet' });
  }
  res.json({ report: incident.report });
}
