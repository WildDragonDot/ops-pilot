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
router.get('/auth/me', requireAuth, getMe);

// Project Routes
router.get('/projects', getProject);
router.get('/projects/:id/health', getProjectHealth);
router.post('/demo/inject-failure', injectFailure);
router.post('/demo/reset', resetEnv);

// Repository Routes
router.get('/repositories', getRepository);
router.post('/repositories/scan', triggerScan);
router.get('/repositories/scans/:id', getScanById);

// Incident Routes
router.post('/incidents', createIncident);
router.get('/incidents', getIncidents);
router.get('/incidents/:id', getIncident);
router.get('/incidents/:id/stream', streamIncident);
router.get('/incidents/:id/report', getReport);

// Approval Routes
router.post('/approvals/:id/approve', approveFix);
router.post('/approvals/:id/reject', rejectFix);
