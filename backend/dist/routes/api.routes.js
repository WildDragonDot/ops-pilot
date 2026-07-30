import { Router } from 'express';
import { register, login, firebaseAuth, getMe } from '../controllers/auth.controller.js';
import { getProject, getProjects, createProject, executeServerCommand, testProjectConnection, deleteProject, getProjectHealth, getServerLogs, injectFailure, resetEnv, suggestAICommand } from '../controllers/project.controller.js';
import { getRepository, triggerScan, getScanById, applyPatch } from '../controllers/repo.controller.js';
import { createIncident, getIncidents, getIncident, streamIncident, getReport } from '../controllers/incident.controller.js';
import { approveFix, rejectFix } from '../controllers/approval.controller.js';
import { getAuditLogs } from '../controllers/audit.controller.js';
import { eventStreamHandler } from '../controllers/stream.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
export const router = Router();
// Public Authentication Routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/firebase', firebaseAuth);
// AI Command Copilot Route
router.post('/ai/suggest-command', requireAuth, suggestAICommand);
// Protected Authentication Profile
router.get('/auth/me', requireAuth, getMe);
// Protected Project & Environment Routes
router.get('/projects', requireAuth, getProjects);
router.post('/projects', requireAuth, createProject);
router.post('/projects/exec', requireAuth, executeServerCommand);
router.post('/projects/test-connection', requireAuth, testProjectConnection);
router.delete('/projects/:id', requireAuth, deleteProject);
router.get('/projects/:id', requireAuth, getProject);
router.get('/projects/:id/health', requireAuth, getProjectHealth);
router.get('/projects/:id/server-logs', requireAuth, getServerLogs);
router.post('/demo/inject-failure', requireAuth, injectFailure);
router.post('/demo/reset', requireAuth, resetEnv);
// Protected Repository Auditor Routes
router.get('/repositories', requireAuth, getRepository);
router.post('/repositories/scan', requireAuth, triggerScan);
router.get('/repositories/scans/:id', requireAuth, getScanById);
router.post('/repositories/findings/:findingId/patch', requireAuth, applyPatch);
// Protected Incident Commander Routes
router.post('/incidents', requireAuth, createIncident);
router.get('/incidents', requireAuth, getIncidents);
router.get('/incidents/:id', requireAuth, getIncident);
router.get('/incidents/:id/stream', requireAuth, streamIncident);
router.get('/incidents/:id/report', requireAuth, getReport);
// Protected Approval Queue & Audit Routes
router.post('/approvals/:id/approve', requireAuth, approveFix);
router.post('/approvals/:id/reject', requireAuth, rejectFix);
router.get('/audit-logs', requireAuth, getAuditLogs);
// Real-Time Event Stream Route
router.get('/stream/events', eventStreamHandler);
