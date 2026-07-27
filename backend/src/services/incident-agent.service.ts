import { EventEmitter } from 'events';
import { runOpenAIIncidentReasoning } from './openai.service.js';

export const incidentEmitter = new EventEmitter();

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

let projectState: Project = {
  id: 'demo-commerce-api',
  name: 'Production E-Commerce API',
  rootPath: '/Users/chandanvishwakarma/Desktop/Office Project/OpsPilot AI/demo-environment',
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
      diff: `--- .env.production\n+++ .env.production\n@@ -4,3 +4,3 @@\n PORT=3000\n-DATABASE_URL=postgresql://admin:SecretPass123@db:5432/commerce_db\n+DATABASE_URL=postgresql://admin:SecretPass123@postgres:5432/commerce_db\n REDIS_URL=redis://redis:6379`
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
      diff: `--- src/controllers/auth.controller.ts\n+++ src/controllers/auth.controller.ts\n@@ -39,5 +39,12 @@\n export async function getUserProfile(req: Request, res: Response) {\n-  const user = await prisma.user.findUnique({\n-    where: { id: req.params.id }\n-  });\n+  const userId = Number(req.params.id);\n+  \n+  if (isNaN(userId) || !Number.isInteger(userId)) {\n+    return res.status(400).json({ error: "Invalid user ID format. Expected integer." });\n+  }\n+\n+  const user = await prisma.user.findUnique({\n+    where: { id: userId }\n+  });`
    },
    verification: [
      { check: 'TypeScript Compiler Check', result: 'Passed (0 errors)' },
      { check: 'Unit Test Suite', result: 'auth.controller.test.ts PASSED (6/6 assertions)' },
      { check: 'API Endpoint Smoke Test', result: 'GET /api/users/101 returned 200 OK' },
      { check: 'Invalid ID Test', result: 'GET /api/users/abc returned 400 Bad Request' }
    ]
  }
};

let incidentsStore: Incident[] = [];

export function getProjectState(): Project {
  return projectState;
}

export function injectFailureScenario(scenarioKey: string) {
  if (scenarioKey === 'DATABASE_STOPPED') {
    projectState.environmentStatus = {
      overall: 'DOWN',
      postgres: 'STOPPED',
      redis: 'RUNNING',
      api: 'CRASHED',
      nginx: 'UPSTREAM_502'
    };
  } else if (scenarioKey === 'CONFIG_MISMATCH') {
    projectState.environmentStatus = {
      overall: 'DEGRADED',
      postgres: 'RUNNING',
      redis: 'RUNNING',
      api: 'CRASHED',
      nginx: 'UPSTREAM_502'
    };
  } else if (scenarioKey === 'CODE_BUG') {
    projectState.environmentStatus = {
      overall: 'DEGRADED',
      postgres: 'RUNNING',
      redis: 'RUNNING',
      api: 'RUNNING',
      nginx: 'HEALTHY'
    };
  }
  return projectState;
}

export function resetEnvironmentState() {
  projectState.environmentStatus = {
    overall: 'HEALTHY',
    postgres: 'RUNNING',
    redis: 'RUNNING',
    api: 'RUNNING',
    nginx: 'HEALTHY'
  };
  return projectState;
}

export function getAllIncidents(): Incident[] {
  return incidentsStore;
}

export function getIncidentById(id: string): Incident | undefined {
  return incidentsStore.find(i => i.id === id);
}

export async function createAndRunIncident(userPrompt: string, scenarioKey: string = 'DATABASE_STOPPED'): Promise<Incident> {
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
    projectId: projectState.id,
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
  
  // Async reasoning timeline execution
  executeAgentReasoning(newIncident, scenario);

  return newIncident;
}

async function executeAgentReasoning(incident: Incident, scenario: any) {
  const addEvent = (evt: Omit<IncidentEvent, 'id' | 'incidentId' | 'createdAt'>) => {
    const fullEvt: IncidentEvent = {
      ...evt,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      incidentId: incident.id,
      createdAt: new Date().toISOString()
    };
    incident.events.push(fullEvt);
    incidentEmitter.emit(`incident_update_${incident.id}`, incident);
  };

  // Attempt OpenAI tool reasoning call
  await runOpenAIIncidentReasoning(incident.userPrompt, scenario);

  // Timeline Step 1: Investigation Plan
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

  // Timeline Step 2: Health endpoint check
  await new Promise(r => setTimeout(r, 1000));
  addEvent({
    type: 'TOOL_CALL',
    title: 'Executing `curl -i http://localhost:8080/health`',
    details: { command: 'curl -i http://localhost:8080/health', output: 'HTTP/1.1 502 Bad Gateway\nServer: nginx/1.25.3\nContent-Type: text/html' },
    status: 'WARNING'
  });

  // Timeline Step 3: Docker status inspect
  await new Promise(r => setTimeout(r, 1200));
  addEvent({
    type: 'TOOL_CALL',
    title: 'Executing `docker compose ps` & log analysis',
    details: { command: 'docker compose ps --format json', output: JSON.stringify(projectState.environmentStatus) },
    status: 'SUCCESS'
  });

  // Timeline Step 4: Gather evidence
  await new Promise(r => setTimeout(r, 1200));
  addEvent({
    type: 'EVIDENCE',
    title: 'Evidence Collected & Correlated',
    details: { evidence: scenario.evidence },
    status: 'SUCCESS'
  });

  // Timeline Step 5: Root cause
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

  // Timeline Step 6: Approval Request
  await new Promise(r => setTimeout(r, 800));
  incident.status = 'AWAITING_APPROVAL';
  addEvent({
    type: 'APPROVAL_REQUEST',
    title: `Approval Required: ${incident.activeApproval?.title}`,
    details: { approval: incident.activeApproval },
    status: 'PENDING'
  });
}

export async function approveIncidentFix(approvalId: string): Promise<Incident | null> {
  const incident = incidentsStore.find(i => i.activeApproval?.id === approvalId);
  if (!incident || !incident.activeApproval) return null;

  incident.activeApproval.status = 'APPROVED';
  incident.status = 'EXECUTING_FIX';

  const approval = incident.activeApproval;
  const scenario = activeScenarios[incident.scenarioKey || 'DATABASE_STOPPED'];

  incident.events.push({
    id: `evt-${Date.now()}-exec`,
    incidentId: incident.id,
    type: 'EXECUTION',
    title: `Approved Fix Executing: ${approval.title}`,
    details: { commands: approval.commands },
    status: 'RUNNING',
    createdAt: new Date().toISOString()
  });
  incidentEmitter.emit(`incident_update_${incident.id}`, incident);

  await new Promise(r => setTimeout(r, 1800));

  // Restore health state
  projectState.environmentStatus = {
    overall: 'HEALTHY',
    postgres: 'RUNNING',
    redis: 'RUNNING',
    api: 'RUNNING',
    nginx: 'HEALTHY'
  };

  incident.events.push({
    id: `evt-${Date.now()}-exec-done`,
    incidentId: incident.id,
    type: 'EXECUTION',
    title: 'Fix Execution Completed Successfully',
    details: { result: 'All commands executed cleanly. Services restored.' },
    status: 'SUCCESS',
    createdAt: new Date().toISOString()
  });

  incident.status = 'VERIFYING';
  incident.events.push({
    id: `evt-${Date.now()}-verif`,
    incidentId: incident.id,
    type: 'VERIFICATION',
    title: 'Running Health & Integration Verification Checks',
    details: { checks: scenario.verification },
    status: 'SUCCESS',
    createdAt: new Date().toISOString()
  });
  incidentEmitter.emit(`incident_update_${incident.id}`, incident);

  await new Promise(r => setTimeout(r, 1200));

  // Build Post-Mortem Report
  const postMortemReport = `# Post-Mortem Incident Report: ${incident.title}

**Incident ID**: \`${incident.id}\`  
**Severity**: \`${incident.severity}\`  
**Status**: \`RESOLVED\`  
**Affected Service**: \`${incident.affectedService}\`  

---

## Executive Summary

On ${new Date(incident.startedAt).toLocaleString()}, OpsPilot AI detected a production failure resulting in ${incident.title}. 

Automated diagnostic tools investigated container logs, database connections, and recent code commits, determining with **${incident.confidence}% confidence** that:
> ${incident.rootCause}

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
`;

  incident.report = postMortemReport;
  incident.status = 'RESOLVED';
  incident.resolvedAt = new Date().toISOString();

  incident.events.push({
    id: `evt-${Date.now()}-rep`,
    incidentId: incident.id,
    type: 'REPORT',
    title: 'Post-Mortem Incident Report Generated',
    details: { reportSummary: 'Post-mortem document published with evidence breakdown and preventive recommendations.' },
    status: 'SUCCESS',
    createdAt: new Date().toISOString()
  });

  incidentEmitter.emit(`incident_update_${incident.id}`, incident);
  return incident;
}

export function rejectIncidentFix(approvalId: string): Incident | null {
  const incident = incidentsStore.find(i => i.activeApproval?.id === approvalId);
  if (!incident || !incident.activeApproval) return null;

  incident.activeApproval.status = 'REJECTED';
  incident.status = 'REJECTED';
  incident.events.push({
    id: `evt-${Date.now()}-rej`,
    incidentId: incident.id,
    type: 'APPROVAL_REQUEST',
    title: 'Fix Execution Rejected by Operator',
    details: { status: 'REJECTED' },
    status: 'FAILED',
    createdAt: new Date().toISOString()
  });

  incidentEmitter.emit(`incident_update_${incident.id}`, incident);
  return incident;
}
