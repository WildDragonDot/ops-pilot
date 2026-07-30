import { Response } from 'express';
import { prisma } from '../services/db.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { writeAuditLog } from '../services/audit-log.service.js';

/**
 * GET /api/org
 * Get the current user's organization details.
 */
export async function getOrg(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId }
    });

    if (!org) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    res.json({ success: true, organization: org });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/org
 * Update organization name. (ADMIN only)
 */
export async function updateOrg(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Organization name is required.' });
    }

    const updated = await prisma.organization.update({
      where: { id: user.organizationId },
      data: { name: name.trim() }
    });

    await writeAuditLog({
      orgId: user.organizationId,
      userId: user.userId,
      userEmail: user.email,
      userName: user.email,
      action: 'ORG_UPDATED',
      category: 'SYSTEM',
      target: updated.name,
      status: 'SUCCESS',
      details: `Organization name updated to "${updated.name}"`
    });

    res.json({ success: true, organization: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/org/stats
 * Get high-level org statistics for the dashboard.
 */
export async function getOrgStats(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    const orgId = user.organizationId;

    const [
      userCount,
      projectCount,
      openIncidentCount,
      resolvedIncidentCount,
      auditLogCount,
      notificationCount
    ] = await Promise.all([
      prisma.user.count({ where: { organizationId: orgId } }),
      prisma.project.count({ where: { organizationId: orgId } }),
      prisma.incident.count({ where: { project: { organizationId: orgId }, status: { not: 'RESOLVED' } } }),
      prisma.incident.count({ where: { project: { organizationId: orgId }, status: 'RESOLVED' } }),
      prisma.auditLog.count({ where: { orgId } }),
      prisma.notification.count({ where: { orgId, read: false } })
    ]);

    res.json({
      success: true,
      stats: {
        users: userCount,
        projects: projectCount,
        openIncidents: openIncidentCount,
        resolvedIncidents: resolvedIncidentCount,
        auditLogs: auditLogCount,
        unreadNotifications: notificationCount
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
