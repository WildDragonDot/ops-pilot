import { EventEmitter } from 'events';
import { prisma } from './db.service.js';
import { runOpenAIIncidentReasoning } from './openai.service.js';
export const incidentEmitter = new EventEmitter();
let projectState = {
    id: 'demo-commerce-api',
    name: 'Production E-Commerce API',
    rootPath: process.cwd(),
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
let activeScenarios = {
    DATABASE_STOPPED: {
        key: 'DATABASE_STOPPED',
        title: 'API returning 502 Bad Gateway',
        prompt: 'Production API down with 502 Bad Gateway response. Trace root cause and apply patch.',
        severity: 'CRITICAL',
        affectedService: 'PostgreSQL / Node.js API',
        confidence: 96,
        rootCause: 'PostgreSQL container is stopped. Node.js API failed to initialize Prisma database client and exited. Nginx returns 502 Bad Gateway due to dead upstream container.',
        evidence: [
            { source: 'Health Endpoint Check', detail: 'HTTP 502 Bad Gateway from http://localhost:8080/health' },
            { source: 'Docker Container Status', detail: 'api_server exited with code 1; postgres_db status is STOPPED' },
            { source: 'Nginx Access Logs', detail: '[error] connect() failed (111: Connection refused) while connecting to upstream http://api:3000' },
            { source: 'Application Error Trace', detail: 'PrismaClientInitializationError: Can\'t reach database server at postgres:5432' }
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
            diff: `--- docker-compose.yml\n+++ docker-compose.yml\n@@ -12,2 +12,2 @@\n-    postgres:\n-      restart: no\n+    postgres:\n+      restart: always`
        },
        verification: [
            { check: 'PostgreSQL Container Status', result: 'RUNNING (healthy)' },
            { check: 'Node.js API Container Status', result: 'RUNNING (PID 4912)' },
            { check: 'Reverse Proxy Route', result: 'Upstream connected' },
            { check: 'Health Endpoint', result: '200 OK (response time: 14ms)' }
        ]
    },
    CONFIG_MISMATCH: {
        key: 'CONFIG_MISMATCH',
        title: 'Database Hostname Configuration Mismatch',
        prompt: 'Investigate why API cannot connect to DB after latest deployment.',
        severity: 'HIGH',
        affectedService: 'Environment Configuration',
        confidence: 93,
        rootCause: 'DATABASE_URL in .env.production points to db:5432 instead of postgres:5432 defined in docker-compose.yml.',
        evidence: [
            { source: 'API Server Logs', detail: 'Fatal Error: getaddrinfo ENOTFOUND db at TCPConnectWrap.afterConnect [as oncomplete]' },
            { source: 'Environment Validator', detail: '.env specifies DATABASE_URL=postgresql://user:pass@db:5432/app' }
        ],
        approval: {
            actionType: 'CONFIG_PATCH',
            title: 'Fix DATABASE_URL hostname in production environment',
            description: 'Update hostname in environment configuration file from "db" to "postgres" and restart API.',
            commands: [
                'sed -i "s/@db:5432/@postgres:5432/g" .env.production',
                'docker compose up -d --build api'
            ],
            riskLevel: 'MEDIUM',
            rollbackPlan: 'Restore backup copy of .env.production.bak and restart container.',
            diff: `--- .env.production\n+++ .env.production\n@@ -4,3 +4,3 @@\n-DATABASE_URL=postgresql://admin:Pass@db:5432/app\n+DATABASE_URL=postgresql://admin:Pass@postgres:5432/app`
        },
        verification: [
            { check: 'Configuration Hostname', result: 'MATCHES docker-compose service name' },
            { check: 'Health Endpoint', result: '200 OK' }
        ]
    },
    CODE_BUG: {
        key: 'CODE_BUG',
        title: 'User Login API 500 Error (Prisma Type Mismatch)',
        prompt: 'Login API 500 error de rahi hai. Stack trace inspect karke safe patch generate karo.',
        severity: 'HIGH',
        affectedService: 'backend/src/controllers/auth.controller.ts',
        confidence: 95,
        rootCause: 'req.params.id is passed directly as a string to Prisma query expecting integer ID.',
        evidence: [
            { source: 'Application Stack Trace', detail: 'PrismaClientValidationError: Expected Int, provided String at auth.controller.ts:42' }
        ],
        approval: {
            actionType: 'CODE_PATCH',
            title: 'Convert route parameter to integer & add validation',
            description: 'Parse req.params.id to a valid Number before querying database.',
            commands: [
                'git apply patch/auth_controller_id.patch',
                'docker compose restart api'
            ],
            riskLevel: 'MEDIUM',
            rollbackPlan: 'git checkout src/controllers/auth.controller.ts',
            diff: `--- backend/src/controllers/auth.controller.ts\n+++ backend/src/controllers/auth.controller.ts\n@@ -40,3 +40,5 @@\n-const user = await prisma.user.findUnique({ where: { id: req.params.id } });\n+const userId = Number(req.params.id);\n+const user = await prisma.user.findUnique({ where: { id: userId } });`
        },
        verification: [
            { check: 'Unit Test Suite', result: 'auth.controller.test.ts PASSED (6/6 assertions)' }
        ]
    }
};
export function getProjectState() {
    return projectState;
}
export function injectFailureScenario(scenarioKey) {
    if (scenarioKey === 'DATABASE_STOPPED') {
        projectState.environmentStatus = { overall: 'DOWN', postgres: 'STOPPED', redis: 'RUNNING', api: 'CRASHED', nginx: 'UPSTREAM_502' };
    }
    else if (scenarioKey === 'CONFIG_MISMATCH') {
        projectState.environmentStatus = { overall: 'DEGRADED', postgres: 'RUNNING', redis: 'RUNNING', api: 'CRASHED', nginx: 'UPSTREAM_502' };
    }
    else if (scenarioKey === 'CODE_BUG') {
        projectState.environmentStatus = { overall: 'DEGRADED', postgres: 'RUNNING', redis: 'RUNNING', api: 'CRASHED', nginx: 'HEALTHY' };
    }
    return projectState;
}
export function resetEnvironmentState() {
    projectState.environmentStatus = { overall: 'HEALTHY', postgres: 'RUNNING', redis: 'RUNNING', api: 'RUNNING', nginx: 'HEALTHY' };
    return projectState;
}
export async function getAllIncidents() {
    const dbIncidents = await prisma.incident.findMany({
        orderBy: { startedAt: 'desc' },
        include: { events: true, approvals: true }
    });
    return dbIncidents.map(inc => ({
        ...inc,
        events: inc.events.map(e => ({
            ...e,
            details: e.details ? JSON.parse(e.details) : undefined
        })),
        activeApproval: inc.approvals.length > 0 ? {
            ...inc.approvals[0],
            commands: inc.approvals[0].commands ? JSON.parse(inc.approvals[0].commands) : []
        } : undefined
    }));
}
export async function getIncidentById(id) {
    const inc = await prisma.incident.findUnique({
        where: { id },
        include: { events: true, approvals: true }
    });
    if (!inc)
        return null;
    return {
        ...inc,
        events: inc.events.map(e => ({
            ...e,
            details: e.details ? JSON.parse(e.details) : undefined
        })),
        activeApproval: inc.approvals.length > 0 ? {
            ...inc.approvals[0],
            commands: inc.approvals[0].commands ? JSON.parse(inc.approvals[0].commands) : []
        } : undefined
    };
}
export async function createAndRunIncident(userPrompt, scenarioKey = 'DATABASE_STOPPED') {
    const scenario = activeScenarios[scenarioKey] || activeScenarios['DATABASE_STOPPED'];
    const incidentId = `inc-${Date.now()}`;
    const approvalId = `appr-${Date.now()}`;
    let project = await prisma.project.findFirst();
    if (!project) {
        project = await prisma.project.create({
            data: {
                id: 'demo-commerce-api',
                name: 'Production E-Commerce API',
                rootPath: process.cwd(),
                runtimeType: 'Docker Compose'
            }
        });
    }
    const incidentTitle = (userPrompt && userPrompt.length > 5)
        ? (userPrompt.length > 55 ? `${userPrompt.substring(0, 52)}...` : userPrompt)
        : scenario.title;
    const newIncident = await prisma.incident.create({
        data: {
            id: incidentId,
            projectId: project.id,
            title: incidentTitle,
            userPrompt: userPrompt || scenario.prompt,
            scenarioKey,
            status: 'INVESTIGATING',
            severity: scenario.severity,
            affectedService: scenario.affectedService,
            confidence: scenario.confidence,
            startedAt: new Date()
        }
    });
    await prisma.approval.create({
        data: {
            id: approvalId,
            incidentId: newIncident.id,
            actionType: scenario.approval.actionType,
            title: scenario.approval.title,
            description: scenario.approval.description,
            commands: JSON.stringify(scenario.approval.commands),
            riskLevel: scenario.approval.riskLevel,
            status: 'PENDING',
            rollbackPlan: scenario.approval.rollbackPlan,
            diff: scenario.approval.diff
        }
    });
    // Run async AI reasoning and timeline persistence
    executeAgentReasoning(incidentId, scenarioKey);
    return getIncidentById(incidentId);
}
async function executeAgentReasoning(incidentId, scenarioKey) {
    const scenario = activeScenarios[scenarioKey] || activeScenarios['DATABASE_STOPPED'];
    const addEvent = async (type, title, detailsObj, status = 'SUCCESS') => {
        const evt = await prisma.incidentEvent.create({
            data: {
                id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                incidentId,
                type,
                title,
                details: JSON.stringify(detailsObj),
                status
            }
        });
        const updated = await getIncidentById(incidentId);
        incidentEmitter.emit(`incident_update_${incidentId}`, updated);
    };
    await runOpenAIIncidentReasoning(scenario.prompt, scenario);
    await new Promise(r => setTimeout(r, 600));
    await addEvent('PLAN', 'Investigation Plan Formulated', {
        steps: [
            '1. Inspect API health endpoints and HTTP status codes',
            '2. Check Docker container status and process logs',
            '3. Analyze application stack traces for database/config errors',
            '4. Formulate root cause & proposed recovery patch'
        ]
    });
    await new Promise(r => setTimeout(r, 900));
    await addEvent('TOOL_CALL', 'Executing `curl -i http://localhost:8080/health`', {
        command: 'curl -i http://localhost:8080/health',
        output: 'HTTP/1.1 502 Bad Gateway\nServer: nginx/1.25.3'
    }, 'WARNING');
    await new Promise(r => setTimeout(r, 1000));
    await addEvent('EVIDENCE', 'Evidence Collected & Correlated', { evidence: scenario.evidence });
    await new Promise(r => setTimeout(r, 800));
    await prisma.incident.update({
        where: { id: incidentId },
        data: { rootCause: scenario.rootCause, status: 'AWAITING_APPROVAL' }
    });
    await addEvent('APPROVAL_REQUEST', `Approval Required: ${scenario.approval.title}`, {
        approval: scenario.approval
    }, 'PENDING');
}
export async function approveIncidentFix(approvalId) {
    const approval = await prisma.approval.findUnique({ where: { id: approvalId } });
    if (!approval)
        return null;
    await prisma.approval.update({
        where: { id: approvalId },
        data: { status: 'APPROVED', decidedAt: new Date() }
    });
    await prisma.incident.update({
        where: { id: approval.incidentId },
        data: { status: 'EXECUTING_FIX' }
    });
    let incident = await getIncidentById(approval.incidentId);
    const scenario = activeScenarios[incident?.scenarioKey || 'DATABASE_STOPPED'];
    await prisma.incidentEvent.create({
        data: {
            id: `evt-${Date.now()}-exec`,
            incidentId: approval.incidentId,
            type: 'EXECUTION',
            title: `Approved Fix Executed: ${approval.title}`,
            details: JSON.stringify({ commands: approval.commands ? JSON.parse(approval.commands) : [] }),
            status: 'SUCCESS'
        }
    });
    projectState.environmentStatus = { overall: 'HEALTHY', postgres: 'RUNNING', redis: 'RUNNING', api: 'RUNNING', nginx: 'HEALTHY' };
    await new Promise(r => setTimeout(r, 1200));
    const postMortemReport = `# Post-Mortem Incident Report: ${incident?.title}

**Incident ID**: \`${incident?.id}\`  
**Severity**: \`${incident?.severity}\`  
**Status**: \`RESOLVED\`  
**Affected Service**: \`${incident?.affectedService}\`  

---

## Executive Summary

OpsPilot AI detected a production failure resulting in ${incident?.title}.

Root cause determined with **${incident?.confidence}% confidence**:
> ${incident?.rootCause}

Following operator approval, OpsPilot AI executed recovery actions, restored service health (HTTP 200), and passed verifications.

---

## Approved Recovery Actions Executed

\`\`\`bash
${approval.commands ? JSON.parse(approval.commands).join('\n') : ''}
\`\`\`
`;
    await prisma.incident.update({
        where: { id: approval.incidentId },
        data: { status: 'RESOLVED', report: postMortemReport, resolvedAt: new Date() }
    });
    const finalInc = await getIncidentById(approval.incidentId);
    incidentEmitter.emit(`incident_update_${approval.incidentId}`, finalInc);
    return finalInc;
}
export async function rejectIncidentFix(approvalId) {
    const approval = await prisma.approval.findUnique({ where: { id: approvalId } });
    if (!approval)
        return null;
    await prisma.approval.update({
        where: { id: approvalId },
        data: { status: 'REJECTED', decidedAt: new Date() }
    });
    await prisma.incident.update({
        where: { id: approval.incidentId },
        data: { status: 'REJECTED' }
    });
    const finalInc = await getIncidentById(approval.incidentId);
    incidentEmitter.emit(`incident_update_${approval.incidentId}`, finalInc);
    return finalInc;
}
