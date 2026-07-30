import { Request, Response } from 'express';
import { prisma } from '../services/db.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { writeAuditLog } from '../services/audit-log.service.js';

function getRequestIp(req: Request): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  const firstForwarded = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return (firstForwarded?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress || 'unknown').replace('::ffff:', '');
}

/**
 * GET /api/audit-logs
 * Query params:
 *   - page       (number, default 1)
 *   - limit      (number, default 20, max 100)
 *   - category   (string, e.g. AUTH | INCIDENT | APPROVAL | SCAN | SYSTEM)
 *   - status     (string, e.g. SUCCESS | WARNING | FAILED)
 *   - search     (string, free-text match on action, target, details)
 *   - startDate  (ISO date string)
 *   - endDate    (ISO date string)
 *   - projectId  (string, filter by project — also filters computed entries)
 */
export async function getAuditLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    const requestIp = getRequestIp(req);

    // Parse pagination
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    // Parse filters
    const category = req.query.category as string | undefined;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const projectId = req.query.projectId as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    // Build Prisma where clause
    const where: any = {
      orgId: user.organizationId,
      ...(category && category !== 'ALL' ? { category } : {}),
      ...(status && status !== 'ALL' ? { status } : {}),
      ...(search
        ? {
            OR: [
              { action: { contains: search } },
              { target: { contains: search } },
              { details: { contains: search } },
              { userEmail: { contains: search } },
              { userName: { contains: search } }
            ]
          }
        : {}),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate + 'T23:59:59Z') } : {})
            }
          }
        : {})
    };

    // Check if we have any persisted audit logs for this org
    const persistedCount = await prisma.auditLog.count({ where });

    let logs: any[] = [];
    let total = 0;

    if (persistedCount > 0) {
      // ── Serve from persisted DB logs ──────────────────────────────────────
      total = persistedCount;
      const dbLogs = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      logs = dbLogs.map(l => ({
        id: l.id,
        timestamp: l.createdAt.toISOString().replace('T', ' ').substring(0, 19),
        user: l.userName || 'System',
        userEmail: l.userEmail || 'system@opspilot.ai',
        action: l.action,
        category: l.category,
        target: l.target,
        ipAddress: l.ipAddress || 'N/A',
        status: l.status,
        details: l.details || ''
      }));
    } else {
      // ── Fallback: compute from incident/scan data (legacy mode) ──────────
      const userName = user.email || 'User';
      const userEmail = user.email;

      const incidentWhere = projectId ? { projectId } : {};
      const scanWhere = projectId ? { repository: { projectId } } : {};

      const incidents = await prisma.incident.findMany({
        where: incidentWhere,
        include: { approvals: true },
        orderBy: { startedAt: 'desc' },
        take: 50
      });

      const scans = await prisma.repositoryScan.findMany({
        where: scanWhere,
        include: { repository: true },
        orderBy: { startedAt: 'desc' },
        take: 20
      });

      const project = projectId
        ? await prisma.project.findUnique({ where: { id: projectId } })
        : await prisma.project.findFirst();

      const allLogs: any[] = [];

      incidents.forEach(inc => {
        allLogs.push({
          id: `log-${inc.id}`,
          timestamp: new Date(inc.startedAt).toISOString().replace('T', ' ').substring(0, 19),
          user: userName,
          userEmail,
          action: 'TRIGGERED_INCIDENT_INVESTIGATION',
          category: 'INCIDENT',
          target: `Incident #${inc.id}`,
          ipAddress: requestIp,
          status: inc.status === 'RESOLVED' ? 'SUCCESS' : 'WARNING',
          details: `Prompt: "${inc.userPrompt}" — Status: ${inc.status}`
        });

        inc.approvals.forEach(appr => {
          if (appr.status !== 'PENDING') {
            allLogs.push({
              id: `log-appr-${appr.id}`,
              timestamp: new Date(appr.decidedAt || inc.startedAt).toISOString().replace('T', ' ').substring(0, 19),
              user: userName,
              userEmail,
              action: appr.status === 'APPROVED' ? 'APPROVED_INCIDENT_FIX' : 'REJECTED_INCIDENT_FIX',
              category: 'APPROVAL',
              target: `Fix #${appr.id} (${inc.title})`,
              ipAddress: requestIp,
              status: appr.status === 'APPROVED' ? 'SUCCESS' : 'FAILED',
              details: `Action: ${appr.actionType} — ${appr.title}`
            });
          }
        });
      });

      scans.forEach(s => {
        const grade = s.overallScore >= 90 ? 'A+' : 'B+';
        allLogs.push({
          id: `log-scan-${s.id}`,
          timestamp: new Date(s.startedAt).toISOString().replace('T', ' ').substring(0, 19),
          user: 'D-OpsPilot Autonomous Agent',
          userEmail: 'agent@system.internal',
          action: 'TRIGGERED_REPO_SCAN',
          category: 'SCAN',
          target: s.repository?.name || 'repository',
          ipAddress: '127.0.0.1',
          status: 'SUCCESS',
          details: `Target Branch: ${s.repository?.defaultBranch || 'main'} — Overall Score: ${s.overallScore}/100 Grade ${grade}`
        });
      });

      allLogs.push({
        id: `log-auth-session`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        user: userName,
        userEmail,
        action: 'USER_LOGIN',
        category: 'AUTH',
        target: project?.name || 'D-OpsPilot Workspace',
        ipAddress: requestIp,
        status: 'SUCCESS',
        details: 'User authenticated via JWT Bearer Token Session.'
      });

      // Apply client-side filters on computed logs
      let filtered = allLogs;
      if (category && category !== 'ALL') filtered = filtered.filter(l => l.category === category);
      if (status && status !== 'ALL') filtered = filtered.filter(l => l.status === status);
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(l =>
          l.action.toLowerCase().includes(q) ||
          l.target.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q) ||
          l.userEmail.toLowerCase().includes(q)
        );
      }

      filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      total = filtered.length;
      logs = filtered.slice(skip, skip + limit);
    }

    // Persist the current login event to kick-start real audit log storage
    // (only if there are no persisted logs yet)
    if (persistedCount === 0) {
      await writeAuditLog({
        orgId: user.organizationId,
        userId: user.userId,
        userEmail: user.email,
        userName: user.email,
        action: 'USER_SESSION_ACTIVE',
        category: 'AUTH',
        target: 'D-OpsPilot Workspace',
        ipAddress: requestIp,
        status: 'SUCCESS',
        details: 'Audit log system initialized — real audit entries will now persist.'
      });
    }

    res.json({
      logs,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      limit
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
