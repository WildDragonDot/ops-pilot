import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, firebaseAuth, getMe } from '../controllers/auth.controller.js';
import { getProject, getProjects, createProject, updateProject, executeServerCommand, testProjectConnection, deleteProject, getProjectHealth, getServerLogs, injectFailure, resetEnv, suggestAICommand, scanServerDirectories, inspectTargetFolder, analyzeLogsWithAIController, checkDeploymentGap, executeAIDeployment } from '../controllers/project.controller.js';
import { getRepository, triggerScan, getScanById, applyPatch } from '../controllers/repo.controller.js';
import { createIncident, getIncidents, getIncident, streamIncident, getReport } from '../controllers/incident.controller.js';
import { approveFix, rejectFix } from '../controllers/approval.controller.js';
import { getAuditLogs } from '../controllers/audit.controller.js';
import { eventStreamHandler } from '../controllers/stream.controller.js';
import { getNotifications, createNotification, markNotificationRead, markAllNotificationsRead, deleteNotification, clearAllNotifications } from '../controllers/notification.controller.js';
import { listUsers, updateUserRole, removeUser, inviteUser } from '../controllers/user.controller.js';
import { getOrg, updateOrg, getOrgStats } from '../controllers/org.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin, requireApprover } from '../middleware/rbac.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.middleware.js';

export const router = Router();

// ─── Auth rate limiter: max 20 attempts per 15 min per IP ─────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts from this IP, please try again after 15 minutes.' }
});

// ─── Public Authentication Routes ────────────────────────────────────────────
router.post('/auth/register', authLimiter, asyncHandler(register));
router.post('/auth/login', authLimiter, asyncHandler(login));
router.post('/auth/firebase', authLimiter, asyncHandler(firebaseAuth));

// ─── Protected Authentication Profile ────────────────────────────────────────
router.get('/auth/me', requireAuth, asyncHandler(getMe));

// ─── AI Command, Log Intelligence & Deployment Routes ────────────────────────
router.post('/ai/suggest-command', requireAuth, asyncHandler(suggestAICommand));
router.post('/ai/analyze-logs', requireAuth, asyncHandler(analyzeLogsWithAIController));
router.get('/projects/:id/deploy-gap', requireAuth, asyncHandler(checkDeploymentGap));
router.post('/projects/ai-deploy', requireAuth, asyncHandler(executeAIDeployment));

// ─── Protected Project & Environment Routes ───────────────────────────────────
router.get('/projects', requireAuth, asyncHandler(getProjects));
router.post('/projects', requireAuth, asyncHandler(createProject));
router.put('/projects/:id', requireAuth, asyncHandler(updateProject));
router.post('/projects/exec', requireAuth, asyncHandler(executeServerCommand));
router.post('/projects/test-connection', requireAuth, asyncHandler(testProjectConnection));
router.post('/projects/scan-directories', requireAuth, asyncHandler(scanServerDirectories));
router.post('/projects/inspect-folder', requireAuth, asyncHandler(inspectTargetFolder));
router.delete('/projects/:id', requireAuth, asyncHandler(deleteProject));
router.get('/projects/:id', requireAuth, asyncHandler(getProject));
router.get('/projects/:id/health', requireAuth, asyncHandler(getProjectHealth));
router.get('/projects/:id/server-logs', requireAuth, asyncHandler(getServerLogs));
router.post('/demo/inject-failure', requireAuth, requireAdmin, asyncHandler(injectFailure));  // ADMIN only
router.post('/demo/reset', requireAuth, requireAdmin, asyncHandler(resetEnv));                // ADMIN only

// ─── Protected Repository Auditor Routes ─────────────────────────────────────
router.get('/repositories', requireAuth, asyncHandler(getRepository));
router.post('/repositories/scan', requireAuth, asyncHandler(triggerScan));
router.get('/repositories/scans/:id', requireAuth, asyncHandler(getScanById));
router.post('/repositories/findings/:findingId/patch', requireAuth, requireApprover, asyncHandler(applyPatch)); // APPROVER+

// ─── Protected Incident Commander Routes ─────────────────────────────────────
router.post('/incidents', requireAuth, asyncHandler(createIncident));
router.get('/incidents', requireAuth, asyncHandler(getIncidents));
router.get('/incidents/:id', requireAuth, asyncHandler(getIncident));
router.get('/incidents/:id/stream', requireAuth, streamIncident); // SSE — intentionally NOT wrapped
router.get('/incidents/:id/report', requireAuth, asyncHandler(getReport));

// ─── Protected Approval Queue Routes (RBAC gated) ────────────────────────────
router.post('/approvals/:id/approve', requireAuth, requireApprover, asyncHandler(approveFix)); // APPROVER+
router.post('/approvals/:id/reject', requireAuth, requireApprover, asyncHandler(rejectFix));   // APPROVER+

// ─── Audit Logs (paginated, filtered) ────────────────────────────────────────
router.get('/audit-logs', requireAuth, asyncHandler(getAuditLogs));

// ─── Notification Routes ─────────────────────────────────────────────────────
router.get('/notifications', requireAuth, asyncHandler(getNotifications));
router.post('/notifications', requireAuth, asyncHandler(createNotification));
router.patch('/notifications/read-all', requireAuth, asyncHandler(markAllNotificationsRead));
router.patch('/notifications/:id/read', requireAuth, asyncHandler(markNotificationRead));
router.delete('/notifications', requireAuth, asyncHandler(clearAllNotifications));
router.delete('/notifications/:id', requireAuth, asyncHandler(deleteNotification));

// ─── User Management Routes (ADMIN only) ─────────────────────────────────────
router.get('/users', requireAuth, requireAdmin, asyncHandler(listUsers));
router.patch('/users/:id/role', requireAuth, requireAdmin, asyncHandler(updateUserRole));
router.delete('/users/:id', requireAuth, requireAdmin, asyncHandler(removeUser));
router.post('/users/invite', requireAuth, requireAdmin, asyncHandler(inviteUser));

// ─── Organization Routes ──────────────────────────────────────────────────────
router.get('/org', requireAuth, asyncHandler(getOrg));
router.patch('/org', requireAuth, requireAdmin, asyncHandler(updateOrg));
router.get('/org/stats', requireAuth, asyncHandler(getOrgStats));

// ─── Real-Time Event Stream Route ─────────────────────────────────────────────
router.get('/stream/events', eventStreamHandler); // SSE — not wrapped (long-lived connection)
