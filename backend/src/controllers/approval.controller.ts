import { Request, Response } from 'express';
import { approveIncidentFix, rejectIncidentFix } from '../services/incident-agent.service.js';

export async function approveFix(req: Request, res: Response) {
  const approvalId = String(req.params.id);
  const incident = await approveIncidentFix(approvalId);
  if (!incident) {
    return res.status(404).json({ error: 'Approval request not found' });
  }
  res.json({ success: true, incident });
}

export function rejectFix(req: Request, res: Response) {
  const approvalId = String(req.params.id);
  const incident = rejectIncidentFix(approvalId);
  if (!incident) {
    return res.status(404).json({ error: 'Approval request not found' });
  }
  res.json({ success: true, incident });
}
