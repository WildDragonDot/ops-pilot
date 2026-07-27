import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const PORT = Number(process.env.PORT || 4173);

app.use(cors());
app.use(express.json());

// Global Event Emitter for SSE real-time streaming
export const incidentEmitter = new EventEmitter();

// In-Memory Data Store (with optional Prisma persistence fallback)
export interface Project {
  id: string;
  name: string;
  rootPath: string;
  runtimeType: string;
  healthCheckUrl: string;
  composeFile: string;
  testCommand: string;
  restartCommand: string;
  environmentStatus: {
    overall: 'HEALTHY' | 'DEGRADED' | 'DOWN';
    postgres: 'RUNNING' | 'STOPPED' | 'ERROR';
    redis: 'RUNNING' | 'STOPPED' | 'ERROR';
    api: 'RUNNING' | 'CRASHED' | 'STOPPED';
    nginx: 'UPSTREAM_502' | 'HEALTHY';
  };
}

export interface Finding {
  id: string;
  scanId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'SECURITY' | 'BUG' | 'CODE_QUALITY' | 'TESTING' | 'COMMIT_RISK';
  title: string;
  filePath?: string;
  line?: number;
  impact: string;
  recommendation: string;
  patch?: string;
}

export interface Scan {
  id: string;
  repositoryId: string;
  status: 'SCANNING' | 'COMPLETED' | 'FAILED';
  overallScore: number;
  securityScore: number;
  qualityScore: number;
  testingScore: number;
  reliabilityScore: number;
  documentationScore: number;
  maintainabilityScore: number;
  summary: string;
  startedAt: string;
  completedAt?: string;
  findings: Finding[];
}

export interface IncidentEvent {
  id: string;
  incidentId: string;
  type: 'PLAN' | 'TOOL_CALL' | 'EVIDENCE' | 'DIAGNOSIS' | 'APPROVAL_REQUEST' | 'EXECUTION' | 'VERIFICATION' | 'REPORT';
  title: string;
  details: any;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'WARNING' | 'FAILED';
  createdAt: string;
}

export interface Approval {
  id: string;
  incidentId: string;
  actionType: string;
  title: string;
  description: string;
  commands: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  diff?: string;
  rollbackPlan: string;
  createdAt: string;
}

export interface Incident {
  id: string;
  projectId: string;
  title: string;
  userPrompt: string;
  scenarioKey?: string;
  status: 'INVESTIGATING' | 'AWAITING_APPROVAL' | 'EXECUTING_FIX' | 'VERIFYING' | 'RESOLVED' | 'REJECTED';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  affectedService: string;
  confidence: number;
  rootCause?: string;
  report?: string;
  startedAt: string;
  resolvedAt?: string;
  events: IncidentEvent[];
  activeApproval?: Approval;
}

// Initial Mock System State
let currentProject: Project = {
  id: 'demo-commerce-api',
  name: 'Production E-Commerce API',
  rootPath: path.join(rootDir, 'demo-environment'),
  runtimeType: 'Docker Compose (Node.js + PostgreSQL + Redis + Nginx)',
  healthCheckUrl: 'http://localhost:8080/health',
  composeFile: 'docker-compose.yml',
  testCommand: 'npm test',
  restartCommand: 'docker compose restart postgres api',
  environmentStatus: {
    overall: 'HEALTHY',
    postgres: 'RUNNING',
    redis: 'RUNNING',
    api: 'RUNNING',
    nginx: 'HEALTHY'
  }
};

let activeScenarios: Record<string, any> = {
  DATABASE_STOPPED: {
    key: 'DATABASE_STOPPED',
    title: 'API returning 502 Bad Gateway',
    prompt: 'Meri production API down hai, 502 Bad Gateway aa raha hai. Root cause trace karke fix karo.',
    severity: 'CRITICAL',
    affectedService: 'PostgreSQL / Node.js API',
    confidence: 96,
    rootCause: 'PostgreSQL container is stopped. Node.js API failed to initialize Prisma database client and exited. Nginx returns 502 Bad Gateway due to dead upstream container.',
    evidence: [
      { source: 'Health Endpoint Check', detail: 'HTTP 502 Bad Gateway from http://localhost:8080/health' },
      { source: 'Docker Container Status', detail: 'api_server exited with code 1; postgres_db status is STOPPED' },
      { source: 'Nginx Access Logs', detail: '[error] connect() failed (111: Connection refused) while connecting to upstream http://api:3000' },
      { source: 'Application Error Trace', detail: 'PrismaClientInitializationError: Can\'t reach database server at postgres:5432' },
      { source: 'Recent Commit Audit', detail: 'Commit #a82f1c modified DB reconnect backoff strategy (0 risks found in code)' }
    ],
    approval: {
      actionType: 'SERVICE_RESTART',
      title: 'Restart PostgreSQL and dependent API container',
      description: 'Start PostgreSQL container, wait for database readiness check, then restart API process.',
      commands: [
        'docker compose start postgres',
        'sleep 2 && docker compose restart api',
        'curl -s http://localhost:8080/health'
      ],
      riskLevel: 'LOW',
      rollbackPlan: 'If health check fails, capture container logs and issue docker compose logs api --tail=100.',
      diff: undefined
    },
    verification: [
      { check: 'PostgreSQL Container Status', result: 'RUNNING (healthy)' },
      { check: 'Node.js API Container Status', result: 'RUNNING (PID 4912)' },
      { check: 'Reverse Proxy Route', result: 'Upstream connected' },
      { check: 'Health Endpoint', result: '200 OK (response time: 14ms)' },
      { check: 'Integration Test Suite', result: '18/18 tests passed' }
    ]
  },
  CONFIG_MISMATCH: {
    key: 'CONFIG_MISMATCH',
    title: 'Database Hostname Configuration Mismatch',
    prompt: 'Investigate why API cannot connect to DB after latest deployment.',
    severity: 'HIGH',
    affectedService: 'Environment Configuration',
    confidence: 93,
    rootCause: 'DATABASE_URL in .env.production points to db:5432 instead of postgres:5432 defined in docker-compose.yml. Docker network DNS cannot resolve hostname "db".',
    evidence: [
      { source: 'API Server Logs', detail: 'Fatal Error: getaddrinfo ENOTFOUND db at TCPConnectWrap.afterConnect [as oncomplete]' },
      { source: 'Environment Validator', detail: '.env specifies DATABASE_URL=postgresql://user:pass@db:5432/app' },
      { source: 'Docker Compose Spec', detail: 'Service name is explicitly defined as "postgres" under networks.backend' },
      { source: 'Health Endpoint Check', detail: 'HTTP 500 Internal Server Error (Database reachability check failed)' }
    ],
    approval: {
      actionType: 'CONFIG_PATCH',
      title: 'Fix DATABASE_URL hostname in production environment',
      description: 'Update hostname in environment configuration file from "db" to "postgres" and restart API.',
      commands: [
        'sed -i "s/@db:5432/@postgres:5432/g" .env.production',
        'docker compose up -d --build api',
        'npm run test:db'
      ],
      riskLevel: 'MEDIUM',
      rollbackPlan: 'Restore backup copy of .env.production.bak and restart container.',
      diff: `--- .env.production
+++ .env.production
@@ -4,3 +4,3 @@
 PORT=3000
-DATABASE_URL=postgresql://admin:SecretPass123@db:5432/commerce_db
+DATABASE_URL=postgresql://admin:SecretPass123@postgres:5432/commerce_db
 REDIS_URL=redis://redis:6379`
    },
    verification: [
      { check: 'Configuration Hostname', result: 'MATCHES docker-compose service name' },
      { check: 'API Container', result: 'Rebuilt and healthy' },
      { check: 'Database Ping', result: 'Connected in 2ms' },
      { check: 'Health Endpoint', result: '200 OK' }
    ]
  },
  CODE_BUG: {
    key: 'CODE_BUG',
    title: 'User Login API 500 Error (Prisma Type Mismatch)',
    prompt: 'Login API 500 error de rahi hai. Stack trace inspect karke safe patch generate karo.',
    severity: 'HIGH',
    affectedService: 'src/controllers/auth.controller.ts',
    confidence: 95,
    rootCause: 'req.params.id is passed directly as a string to prisma.user.findUnique({ where: { id } }), but the Prisma schema defines `id` as an Int. Unhandled exception returns 500.',
    evidence: [
      { source: 'Application Stack Trace', detail: 'PrismaClientValidationError: Invalid argument `where.id`: Expected Int, provided String at auth.controller.ts:42' },
      { source: 'Git Diff Inspector', detail: 'Recent commit #c941ea changed req.params parse helper to direct assignment' },
      { source: 'Code Audit', detail: 'Line 42: const user = await prisma.user.findUnique({ where: { id: req.params.id } })' }
    ],
    approval: {
      actionType: 'CODE_PATCH',
      title: 'Convert route parameter to integer & add validation',
      description: 'Parse req.params.id to a valid Number and check for integer validity before passing to database model.',
      commands: [
        'git apply patch/auth_controller_id.patch',
        'npm test -- auth.controller.test.ts',
        'docker compose restart api'
      ],
      riskLevel: 'MEDIUM',
      rollbackPlan: 'git checkout src/controllers/auth.controller.ts to restore original code.',
      diff: `--- src/controllers/auth.controller.ts
+++ src/controllers/auth.controller.ts
@@ -39,5 +39,12 @@
 export async function getUserProfile(req: Request, res: Response) {
-  const user = await prisma.user.findUnique({
-    where: { id: req.params.id }
-  });
+  const userId = Number(req.params.id);
+  
+  if (isNaN(userId) || !Number.isInteger(userId)) {
+    return res.status(400).json({ error: "Invalid user ID format. Expected integer." });
+  }
+
+  const user = await prisma.user.findUnique({
+    where: { id: userId }
+  });`
    },
    verification: [
      { check: 'TypeScript Compiler Check', result: 'Passed (0 errors)' },
      { check: 'Unit Test Suite', result: 'auth.controller.test.ts PASSED (6/6 assertions)' },
      { check: 'API Endpoint Smoke Test', result: 'GET /api/users/101 returned 200 OK' },
      { check: 'Invalid ID Test', result: 'GET /api/users/abc returned 400 Bad Request' }
    ]
  }
};

let repositoryScanStore: Scan = {
  id: 'scan-latest-001',
  repositoryId: 'opspilot-demo-repo',
  status: 'COMPLETED',
  overallScore: 78,
  securityScore: 72,
  qualityScore: 80,
  testingScore: 65,
  reliabilityScore: 85,
  documentationScore: 90,
  maintainabilityScore: 76,
  summary: 'Repository audit detected 2 Critical Security risks, 1 Runtime Bug risk, and missing test coverage on authentication endpoints.',
  startedAt: new Date(Date.now() - 3600000).toISOString(),
  completedAt: new Date(Date.now() - 3540000).toISOString(),
  findings: [
    {
      id: 'find-sec-1',
      scanId: 'scan-latest-001',
      severity: 'CRITICAL',
      category: 'SECURITY',
      title: 'Hardcoded JWT Secret in Source Code',
      filePath: 'src/config/auth.ts',
      line: 14,
      impact: 'Anyone with read access to the repository can forge administrative access tokens.',
      recommendation: 'Move secret to process.env.JWT_SECRET and fail startup if missing.',
      patch: `--- src/config/auth.ts\n+++ src/config/auth.ts\n@@ -13,2 +13,5 @@\n-export const JWT_SECRET = "super_secret_production_key_12345";\n+export const JWT_SECRET = process.env.JWT_SECRET;\n+if (!JWT_SECRET) {\n+  throw new Error("FATAL: JWT_SECRET environment variable is missing!");\n+}`
    },
    {
      id: 'find-bug-1',
      scanId: 'scan-latest-001',
      severity: 'CRITICAL',
      category: 'BUG',
      title: 'Unsanitized String Passed to Integer DB Field',
      filePath: 'src/controllers/auth.controller.ts',
      line: 42,
      impact: 'Triggers unhandled Prisma Client Validation exception resulting in 500 error for valid requests.',
      recommendation: 'Cast route parameter using Number(req.params.id) and return HTTP 400 if invalid.',
      patch: `--- src/controllers/auth.controller.ts\n+++ src/controllers/auth.controller.ts\n@@ -41,2 +41,5 @@\n-const user = await prisma.user.findUnique({ where: { id: req.params.id } });\n+const userId = Number(req.params.id);\n+if (isNaN(userId)) return res.status(400).json({ error: "Invalid ID" });\n+const user = await prisma.user.findUnique({ where: { id: userId } });`
    },
    {
      id: 'find-risk-1',
      scanId: 'scan-latest-001',
      severity: 'HIGH',
      category: 'COMMIT_RISK',
      title: 'Risky Database Reconnect Strategy Introduced in Commit #a82f1c',
      filePath: 'src/db/connection.ts',
      line: 28,
      impact: 'Removed reconnect retry limit. May freeze container event loop during network blips.',
      recommendation: 'Re-introduce maximum retry limit of 5 attempts with exponential backoff.',
      patch: undefined
    },
    {
      id: 'find-test-1',
      scanId: 'scan-latest-001',
      severity: 'MEDIUM',
      category: 'TESTING',
      title: 'Missing Integration Test Coverage for Authentication Routes',
      filePath: 'src/routes/auth.routes.ts',
      line: 1,
      impact: 'Regressions in JWT validation or token expiry go undetected during CI build.',
      recommendation: 'Add integration test file src/tests/auth.test.ts covering 401 & 403 cases.',
      patch: undefined
    }
  ]
};

let incidentsStore: Incident[] = [];

// ======================= API ROUTES ======================= //

// GET /api/projects - Get current project metadata & health status
app.get('/api/projects', (req, res) => {
  res.json({ project: currentProject });
});

// GET /api/projects/:id/health - Health check endpoint
app.get('/api/projects/:id/health', (req, res) => {
  res.json({
    status: currentProject.environmentStatus.overall,
    services: currentProject.environmentStatus,
    timestamp: new Date().toISOString()
  });
});

// GET /api/repositories - Repository info
app.get('/api/repositories', (req, res) => {
  res.json({
    repository: {
      id: 'opspilot-demo-repo',
      name: 'company/production-backend-api',
      url: 'https://github.com/company/production-backend-api',
      defaultBranch: 'main',
      lastScannedAt: repositoryScanStore.completedAt,
      latestScan: repositoryScanStore
    }
  });
});

// POST /api/repositories/scan - Trigger interactive repo scan
app.post('/api/repositories/scan', async (req, res) => {
  const scanId = `scan-${Date.now()}`;
  const newScan: Scan = {
    id: scanId,
    repositoryId: 'opspilot-demo-repo',
    status: 'SCANNING',
    overallScore: 0,
    securityScore: 0,
    qualityScore: 0,
    testingScore: 0,
    reliabilityScore: 0,
    documentationScore: 0,
    maintainabilityScore: 0,
    summary: 'Scanning repository structure, security secrets, dependency vulnerabilities, and commit risks...',
    startedAt: new Date().toISOString(),
    findings: []
  };

  repositoryScanStore = newScan;
  res.json({ scan: newScan });

  // Simulate step-by-step scanner progression via SSE / Background updates
  setTimeout(() => {
    repositoryScanStore = {
      ...repositoryScanStore,
      status: 'COMPLETED',
      overallScore: 78,
      securityScore: 72,
      qualityScore: 80,
      testingScore: 65,
      reliabilityScore: 85,
      documentationScore: 90,
      maintainabilityScore: 76,
      completedAt: new Date().toISOString(),
      summary: 'Scan complete. Detected 2 Critical findings, 1 Commit Risk, and missing unit test coverage.',
      findings: [
        {
          id: `find-sec-${Date.now()}`,
          scanId,
          severity: 'CRITICAL',
          category: 'SECURITY',
          title: 'Hardcoded JWT Secret in Source Code',
          filePath: 'src/config/auth.ts',
          line: 14,
          impact: 'Exposes administrative token generation to repository readers.',
          recommendation: 'Use process.env.JWT_SECRET and require runtime validation.',
          patch: `--- src/config/auth.ts\n+++ src/config/auth.ts\n@@ -13,2 +13,5 @@\n-export const JWT_SECRET = "super_secret_key";\n+export const JWT_SECRET = process.env.JWT_SECRET;`
        },
        {
          id: `find-bug-${Date.now()}`,
          scanId,
          severity: 'CRITICAL',
          category: 'BUG',
          title: 'String Parameter Passed to Integer Field in Query',
          filePath: 'src/controllers/auth.controller.ts',
          line: 42,
          impact: 'Causes HTTP 500 error when querying user by route parameter string.',
          recommendation: 'Cast parameter to Number before passing to database query.',
          patch: `--- src/controllers/auth.controller.ts\n+++ src/controllers/auth.controller.ts\n@@ -41,1 +41,2 @@\n-const user = await prisma.user.findUnique({ where: { id: req.params.id } });\n+const userId = Number(req.params.id);\n+const user = await prisma.user.findUnique({ where: { id: userId } });`
        },
        {
          id: `find-risk-${Date.now()}`,
          scanId,
          severity: 'HIGH',
          category: 'COMMIT_RISK',
          title: 'Recent Commit #a82f1c Changed Database Connection Retry Limit',
          filePath: 'src/db/connection.ts',
          line: 28,
          impact: 'May cause infinite loop during container startup blips.',
          recommendation: 'Enforce max retry ceiling of 5 reconnect attempts.'
        }
      ]
    };
    incidentEmitter.emit('scan_update', repositoryScanStore);
  }, 2500);
});

// GET /api/repositories/scans/:id - Scan details
app.get('/api/repositories/scans/:id', (req, res) => {
  res.json({ scan: repositoryScanStore });
});

// POST /api/demo/inject-failure - Inject failure scenario
app.post('/api/demo/inject-failure', (req, res) => {
  const { scenarioKey } = req.body;
  if (scenarioKey === 'DATABASE_STOPPED') {
    currentProject.environmentStatus = {
      overall: 'DOWN',
      postgres: 'STOPPED',
      redis: 'RUNNING',
      api: 'CRASHED',
      nginx: 'UPSTREAM_502'
    };
  } else if (scenarioKey === 'CONFIG_MISMATCH') {
    currentProject.environmentStatus = {
      overall: 'DEGRADED',
      postgres: 'RUNNING',
      redis: 'RUNNING',
      api: 'CRASHED',
      nginx: 'UPSTREAM_502'
    };
  } else if (scenarioKey === 'CODE_BUG') {
    currentProject.environmentStatus = {
      overall: 'DEGRADED',
      postgres: 'RUNNING',
      redis: 'RUNNING',
      api: 'RUNNING',
      nginx: 'HEALTHY'
    };
  }
  res.json({ success: true, project: currentProject });
});

// POST /api/demo/reset - Reset environment to healthy state
app.post('/api/demo/reset', (req, res) => {
  currentProject.environmentStatus = {
    overall: 'HEALTHY',
    postgres: 'RUNNING',
    redis: 'RUNNING',
    api: 'RUNNING',
    nginx: 'HEALTHY'
  };
  res.json({ success: true, project: currentProject });
});

// POST /api/incidents - Launch new investigation
app.post('/api/incidents', (req, res) => {
  const { userPrompt, scenarioKey = 'DATABASE_STOPPED' } = req.body;
  const scenario = activeScenarios[scenarioKey] || activeScenarios['DATABASE_STOPPED'];

  const incidentId = `inc-${Date.now()}`;
  const approvalId = `appr-${Date.now()}`;

  const newApproval: Approval = {
    id: approvalId,
    incidentId,
    actionType: scenario.approval.actionType,
    title: scenario.approval.title,
    description: scenario.approval.description,
    commands: scenario.approval.commands,
    riskLevel: scenario.approval.riskLevel,
    status: 'PENDING',
    rollbackPlan: scenario.approval.rollbackPlan,
    diff: scenario.approval.diff,
    createdAt: new Date().toISOString()
  };

  const newIncident: Incident = {
    id: incidentId,
    projectId: currentProject.id,
    title: scenario.title,
    userPrompt: userPrompt || scenario.prompt,
    scenarioKey,
    status: 'INVESTIGATING',
    severity: scenario.severity,
    affectedService: scenario.affectedService,
    confidence: scenario.confidence,
    startedAt: new Date().toISOString(),
    events: [],
    activeApproval: newApproval
  };

  incidentsStore.unshift(newIncident);
  res.json({ incident: newIncident });

  // Run async agent reasoning timeline
  runAgentDiagnosticLoop(newIncident, scenario);
});

// Helper: Run diagnostic agent loop and stream timeline events
async function runAgentDiagnosticLoop(incident: Incident, scenario: any) {
  const addEvent = (event: Omit<IncidentEvent, 'id' | 'incidentId' | 'createdAt'>) => {
    const fullEvent: IncidentEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      incidentId: incident.id,
      createdAt: new Date().toISOString()
    };
    incident.events.push(fullEvent);
    incidentEmitter.emit(`incident_update_${incident.id}`, incident);
  };

  // Step 1: Investigation Plan
  await new Promise(r => setTimeout(r, 600));
  addEvent({
    type: 'PLAN',
    title: 'Investigation Plan Formulated',
    details: {
      steps: [
        '1. Inspect API health endpoints and HTTP status codes',
        '2. Check Docker container status and process logs',
        '3. Analyze application stack traces for database/config errors',
        '4. Correlate symptoms with recent Git commits & environment variables',
        '5. Formulate root cause & proposed recovery patch'
      ]
    },
    status: 'SUCCESS'
  });

  // Step 2: Health check tool execution
  await new Promise(r => setTimeout(r, 1000));
  addEvent({
    type: 'TOOL_CALL',
    title: 'Executing `curl -i http://localhost:8080/health`',
    details: { command: 'curl -i http://localhost:8080/health', output: 'HTTP/1.1 502 Bad Gateway\nServer: nginx/1.25.3\nContent-Type: text/html' },
    status: 'WARNING'
  });

  // Step 3: Docker status & log inspection
  await new Promise(r => setTimeout(r, 1200));
  addEvent({
    type: 'TOOL_CALL',
    title: 'Executing `docker compose ps` & log analysis',
    details: { command: 'docker compose ps --format json', output: JSON.stringify(currentProject.environmentStatus) },
    status: 'SUCCESS'
  });

  // Step 4: Gather evidence
  await new Promise(r => setTimeout(r, 1200));
  addEvent({
    type: 'EVIDENCE',
    title: 'Evidence Collected & Correlated',
    details: { evidence: scenario.evidence },
    status: 'SUCCESS'
  });

  // Step 5: Root Cause Diagnosis
  await new Promise(r => setTimeout(r, 1000));
  incident.rootCause = scenario.rootCause;
  addEvent({
    type: 'DIAGNOSIS',
    title: 'Root Cause Pinpointed with High Confidence',
    details: {
      confidence: `${scenario.confidence}%`,
      rootCause: scenario.rootCause,
      affectedService: scenario.affectedService
    },
    status: 'SUCCESS'
  });

  // Step 6: Approval Request Required
  await new Promise(r => setTimeout(r, 800));
  incident.status = 'AWAITING_APPROVAL';
  addEvent({
    type: 'APPROVAL_REQUEST',
    title: `Approval Required: ${incident.activeApproval?.title}`,
    details: { approval: incident.activeApproval },
    status: 'PENDING'
  });
}

// GET /api/incidents - List incidents
app.get('/api/incidents', (req, res) => {
  res.json({ incidents: incidentsStore });
});

// GET /api/incidents/:id - Get incident details
app.get('/api/incidents/:id', (req, res) => {
  const incident = incidentsStore.find(i => i.id === req.params.id);
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }
  res.json({ incident });
});

// GET /api/incidents/:id/stream - SSE real-time event stream
app.get('/api/incidents/:id/stream', (req, res) => {
  const incidentId = req.params.id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const onUpdate = (updatedIncident: Incident) => {
    res.write(`data: ${JSON.stringify(updatedIncident)}\n\n`);
  };

  incidentEmitter.on(`incident_update_${incidentId}`, onUpdate);

  // Send initial state
  const incident = incidentsStore.find(i => i.id === incidentId);
  if (incident) {
    res.write(`data: ${JSON.stringify(incident)}\n\n`);
  }

  req.on('close', () => {
    incidentEmitter.off(`incident_update_${incidentId}`, onUpdate);
  });
});

// POST /api/approvals/:id/approve - Approve fix execution
app.post('/api/approvals/:id/approve', async (req, res) => {
  const approvalId = req.params.id;
  let targetIncident: Incident | undefined;

  for (const inc of incidentsStore) {
    if (inc.activeApproval && inc.activeApproval.id === approvalId) {
      targetIncident = inc;
      break;
    }
  }

  if (!targetIncident || !targetIncident.activeApproval) {
    return res.status(404).json({ error: 'Approval request not found or already processed' });
  }

  targetIncident.activeApproval.status = 'APPROVED';
  targetIncident.status = 'EXECUTING_FIX';

  const approval = targetIncident.activeApproval;
  const scenario = activeScenarios[targetIncident.scenarioKey || 'DATABASE_STOPPED'];

  res.json({ success: true, incident: targetIncident });

  // Add event: Execution started
  targetIncident.events.push({
    id: `evt-${Date.now()}-exec`,
    incidentId: targetIncident.id,
    type: 'EXECUTION',
    title: `Approved Fix Executing: ${approval.title}`,
    details: { commands: approval.commands },
    status: 'RUNNING',
    createdAt: new Date().toISOString()
  });
  incidentEmitter.emit(`incident_update_${targetIncident.id}`, targetIncident);

  // Execute recovery actions
  await new Promise(r => setTimeout(r, 1800));

  // Reset environment status to HEALTHY
  currentProject.environmentStatus = {
    overall: 'HEALTHY',
    postgres: 'RUNNING',
    redis: 'RUNNING',
    api: 'RUNNING',
    nginx: 'HEALTHY'
  };

  targetIncident.events.push({
    id: `evt-${Date.now()}-exec-done`,
    incidentId: targetIncident.id,
    type: 'EXECUTION',
    title: 'Fix Execution Completed Successfully',
    details: { result: 'All commands executed cleanly. Containers operational.' },
    status: 'SUCCESS',
    createdAt: new Date().toISOString()
  });

  // Run automated verifications
  targetIncident.status = 'VERIFYING';
  targetIncident.events.push({
    id: `evt-${Date.now()}-verif`,
    incidentId: targetIncident.id,
    type: 'VERIFICATION',
    title: 'Running Health & Integration Verification Checks',
    details: { checks: scenario.verification },
    status: 'SUCCESS',
    createdAt: new Date().toISOString()
  });
  incidentEmitter.emit(`incident_update_${targetIncident.id}`, targetIncident);

  await new Promise(r => setTimeout(r, 1200));

  // Generate Post-Mortem Report
  const postMortemReport = `# Post-Mortem Incident Report: ${targetIncident.title}

**Incident ID**: \`${targetIncident.id}\`  
**Severity**: \`${targetIncident.severity}\`  
**Status**: \`RESOLVED\`  
**Affected Service**: \`${targetIncident.affectedService}\`  
**Incident Duration**: \`3 minutes 42 seconds\`  

---

## Executive Summary

On ${new Date(targetIncident.startedAt).toLocaleString()}, OpsPilot AI detected a production failure resulting in ${targetIncident.title}. 

Automated diagnostic tools investigated container logs, database connections, and recent code commits, determining with **${targetIncident.confidence}% confidence** that:
> ${targetIncident.rootCause}

Following human review and explicit operator approval, OpsPilot AI executed the recovery plan, restored service health, verified all health endpoints (HTTP 200), and passed automated integration tests.

---

## Evidence Citing

| Evidence Source | Observed Data / Trace |
| :--- | :--- |
${scenario.evidence.map((e: any) => `| **${e.source}** | \`${e.detail}\` |`).join('\n')}

---

## Approved Recovery Actions Executed

\`\`\`bash
${approval.commands.join('\n')}
\`\`\`

---

## Post-Fix Verification

| Verification Checklist | Status |
| :--- | :--- |
${scenario.verification.map((v: any) => `| ${v.check} | **${v.result}** |`).join('\n')}

---

## Preventive Recommendations

1. **Automate Container Readiness Checks**: Add database healthcheck in \`docker-compose.yml\` with exponential retry delay.
2. **CI Environment Validation**: Add a build-step lint rule to validate \`DATABASE_URL\` hostname format against Compose service names.
3. **Strict Type Validation**: Enforce Zod or TypeScript strict parameter validation on all route controllers before database invocation.
`;

  targetIncident.report = postMortemReport;
  targetIncident.status = 'RESOLVED';
  targetIncident.resolvedAt = new Date().toISOString();

  targetIncident.events.push({
    id: `evt-${Date.now()}-rep`,
    incidentId: targetIncident.id,
    type: 'REPORT',
    title: 'Post-Mortem Incident Report Generated',
    details: { reportSummary: 'Post-mortem document published with evidence breakdown and preventive recommendations.' },
    status: 'SUCCESS',
    createdAt: new Date().toISOString()
  });

  incidentEmitter.emit(`incident_update_${targetIncident.id}`, targetIncident);
});

// POST /api/approvals/:id/reject - Reject fix
app.post('/api/approvals/:id/reject', (req, res) => {
  const approvalId = req.params.id;
  for (const inc of incidentsStore) {
    if (inc.activeApproval && inc.activeApproval.id === approvalId) {
      inc.activeApproval.status = 'REJECTED';
      inc.status = 'REJECTED';
      inc.events.push({
        id: `evt-${Date.now()}-rej`,
        incidentId: inc.id,
        type: 'APPROVAL_REQUEST',
        title: 'Fix Execution Rejected by Operator',
        details: { status: 'REJECTED' },
        status: 'FAILED',
        createdAt: new Date().toISOString()
      });
      incidentEmitter.emit(`incident_update_${inc.id}`, inc);
      return res.json({ success: true, incident: inc });
    }
  }
  res.status(404).json({ error: 'Approval request not found' });
});

// GET /api/incidents/:id/report - Get Post-Mortem Report
app.get('/api/incidents/:id/report', (req, res) => {
  const incident = incidentsStore.find(i => i.id === req.params.id);
  if (!incident || !incident.report) {
    return res.status(404).json({ error: 'Report not available yet' });
  }
  res.json({ report: incident.report });
});

// Serve compiled Vite React application
const distDir = path.join(rootDir, 'dist');
app.use(express.static(distDir));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(distDir, 'index.html'));
});

// Start Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 OpsPilot AI Server listening on http://0.0.0.0:${PORT}`);
});
