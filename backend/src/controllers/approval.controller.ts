import { Request, Response } from 'express';
import { approveIncidentFix, rejectIncidentFix } from '../services/incident-agent.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { writeAuditLog } from '../services/audit-log.service.js';

export async function approveFix(req: AuthenticatedRequest, res: Response) {
  const approvalId = String(req.params.id);
  const user = req.user;

  const incident = await approveIncidentFix(approvalId);
  if (!incident) {
    return res.status(404).json({ error: 'Approval request not found' });
  }

  // Write audit log entry
  if (user) {
    await writeAuditLog({
      orgId: user.organizationId,
      userId: user.userId,
      userEmail: user.email,
      userName: user.email,
      action: 'APPROVED_INCIDENT_FIX',
      category: 'APPROVAL',
      target: `Approval #${approvalId}`,
      status: 'SUCCESS',
      details: `Incident fix approved by ${user.email} (role: ${user.role})`
    });
  }

  res.json({ success: true, incident });
}

export async function rejectFix(req: AuthenticatedRequest, res: Response) {
  const approvalId = String(req.params.id);
  const user = req.user;

  const incident = await rejectIncidentFix(approvalId);
  if (!incident) {
    return res.status(404).json({ error: 'Approval request not found' });
  }

  // Write audit log entry
  if (user) {
    await writeAuditLog({
      orgId: user.organizationId,
      userId: user.userId,
      userEmail: user.email,
      userName: user.email,
      action: 'REJECTED_INCIDENT_FIX',
      category: 'APPROVAL',
      target: `Approval #${approvalId}`,
      status: 'FAILED',
      details: `Incident fix rejected by ${user.email} (role: ${user.role})`
    });
  }

  res.json({ success: true, incident });
}
