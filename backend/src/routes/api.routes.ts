import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller.js';
import { getProject, getProjectHealth, injectFailure, resetEnv } from '../controllers/project.controller.js';
import { getRepository, triggerScan, getScanById } from '../controllers/repo.controller.js';
import { createIncident, getIncidents, getIncident, streamIncident, getReport } from '../controllers/incident.controller.js';
import { approveFix, rejectFix } from '../controllers/approval.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const router = Router();

// Public Authentication Routes
router.post('/auth/register', register);
router.post('/auth/login', login);

// Protected Authentication Profile
router.get('/auth/me', requireAuth, getMe);

// Protected Project & Environment Routes
router.get('/projects', requireAuth, getProject);
router.get('/projects/:id/health', requireAuth, getProjectHealth);
router.post('/demo/inject-failure', requireAuth, injectFailure);
router.post('/demo/reset', requireAuth, resetEnv);

// Protected Repository Auditor Routes
router.get('/repositories', requireAuth, getRepository);
router.post('/repositories/scan', requireAuth, triggerScan);
router.get('/repositories/scans/:id', requireAuth, getScanById);

// Protected Incident Commander Routes
router.post('/incidents', requireAuth, createIncident);
router.get('/incidents', requireAuth, getIncidents);
router.get('/incidents/:id', requireAuth, getIncident);
router.get('/incidents/:id/stream', requireAuth, streamIncident);
router.get('/incidents/:id/report', requireAuth, getReport);

// Protected Approval Queue Routes
router.post('/approvals/:id/approve', requireAuth, approveFix);
router.post('/approvals/:id/reject', requireAuth, rejectFix);
