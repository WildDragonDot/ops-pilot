import { Router } from 'express';
import { register, login, firebaseAuth, getMe } from '../controllers/auth.controller.js';
import { getProject, getProjects, createProject, executeServerCommand, testProjectConnection, deleteProject, getProjectHealth, getServerLogs, injectFailure, resetEnv, suggestAICommand, scanServerDirectories, analyzeLogsWithAIController, checkDeploymentGap, executeAIDeployment } from '../controllers/project.controller.js';
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

export const router = Router();

// ─── Public Authentication Routes ────────────────────────────────────────────
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/firebase', firebaseAuth);

// ─── Protected Authentication Profile ────────────────────────────────────────
router.get('/auth/me', requireAuth, getMe);

// ─── AI Command, Log Intelligence & Deployment Routes ────────────────────────
router.post('/ai/suggest-command', requireAuth, suggestAICommand);
router.post('/ai/analyze-logs', requireAuth, analyzeLogsWithAIController);
router.get('/projects/:id/deploy-gap', requireAuth, checkDeploymentGap);
router.post('/projects/ai-deploy', requireAuth, executeAIDeployment);

// ─── Protected Project & Environment Routes ───────────────────────────────────
router.get('/projects', requireAuth, getProjects);
router.post('/projects', requireAuth, createProject);
router.post('/projects/exec', requireAuth, executeServerCommand);
router.post('/projects/test-connection', requireAuth, testProjectConnection);
router.post('/projects/scan-directories', requireAuth, scanServerDirectories);
router.delete('/projects/:id', requireAuth, requireAdmin, deleteProject);        // ADMIN only
router.get('/projects/:id', requireAuth, getProject);
router.get('/projects/:id/health', requireAuth, getProjectHealth);
router.get('/projects/:id/server-logs', requireAuth, getServerLogs);
router.post('/demo/inject-failure', requireAuth, requireAdmin, injectFailure);   // ADMIN only
router.post('/demo/reset', requireAuth, requireAdmin, resetEnv);                  // ADMIN only

// ─── Protected Repository Auditor Routes ─────────────────────────────────────
router.get('/repositories', requireAuth, getRepository);
router.post('/repositories/scan', requireAuth, triggerScan);
router.get('/repositories/scans/:id', requireAuth, getScanById);
router.post('/repositories/findings/:findingId/patch', requireAuth, requireApprover, applyPatch); // APPROVER+

// ─── Protected Incident Commander Routes ─────────────────────────────────────
router.post('/incidents', requireAuth, createIncident);
router.get('/incidents', requireAuth, getIncidents);
router.get('/incidents/:id', requireAuth, getIncident);
router.get('/incidents/:id/stream', requireAuth, streamIncident);
router.get('/incidents/:id/report', requireAuth, getReport);

// ─── Protected Approval Queue Routes (RBAC gated) ────────────────────────────
router.post('/approvals/:id/approve', requireAuth, requireApprover, approveFix); // APPROVER+
router.post('/approvals/:id/reject', requireAuth, requireApprover, rejectFix);   // APPROVER+

// ─── Audit Logs (paginated, filtered) ────────────────────────────────────────
router.get('/audit-logs', requireAuth, getAuditLogs);

// ─── Notification Routes ─────────────────────────────────────────────────────
router.get('/notifications', requireAuth, getNotifications);
router.post('/notifications', requireAuth, createNotification);
router.patch('/notifications/read-all', requireAuth, markAllNotificationsRead);
router.patch('/notifications/:id/read', requireAuth, markNotificationRead);
router.delete('/notifications', requireAuth, clearAllNotifications);
router.delete('/notifications/:id', requireAuth, deleteNotification);

// ─── User Management Routes (ADMIN only) ─────────────────────────────────────
router.get('/users', requireAuth, requireAdmin, listUsers);
router.patch('/users/:id/role', requireAuth, requireAdmin, updateUserRole);
router.delete('/users/:id', requireAuth, requireAdmin, removeUser);
router.post('/users/invite', requireAuth, requireAdmin, inviteUser);

// ─── Organization Routes ──────────────────────────────────────────────────────
router.get('/org', requireAuth, getOrg);
router.patch('/org', requireAuth, requireAdmin, updateOrg);
router.get('/org/stats', requireAuth, getOrgStats);

// ─── Real-Time Event Stream Route ─────────────────────────────────────────────
router.get('/stream/events', eventStreamHandler);
