import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
let prisma = null;

const blockedActions = [
  "rm -rf",
  "docker system prune",
  "delete docker volume",
  "force git reset",
  "database write query",
  "firewall change"
];

const project = {
  id: "demo-commerce-api",
  name: "Demo Commerce API",
  rootPath: path.join(rootDir, "demo-environment"),
  runtimeType: "Local Docker Compose",
  healthCheckUrl: "http://localhost:8080/health",
  composeFile: "docker-compose.yml",
  testCommand: "npm test",
  restartCommand: "docker compose restart postgres api"
};

const scenarios = {
  DATABASE_STOPPED: {
    title: "API returning 502",
    prompt: "Our production API is returning 502. Find the cause and recover it.",
    severity: "CRITICAL",
    affectedService: "API",
    confidence: 94,
    rootCause:
      "PostgreSQL is stopped, which prevents the API from initializing Prisma. Nginx returns 502 because the API is not accepting requests.",
    proposedActions: [
      {
        id: "restart-postgres",
        label: "Restart PostgreSQL service",
        command: "docker compose restart postgres",
        risk: "LOW",
        approvalRequired: true
      },
      {
        id: "restart-api",
        label: "Restart API service",
        command: "docker compose restart api",
        risk: "LOW",
        approvalRequired: true
      }
    ],
    evidence: [
      ["Health endpoint", "HTTP 502 from http://localhost:8080/health"],
      ["Nginx logs", "connect() failed while connecting to upstream api:3000"],
      ["Docker status", "api exited with code 1; postgres is stopped"],
      ["API logs", "Prisma cannot connect to postgres:5432"]
    ],
    verification: [
      ["PostgreSQL", "Healthy"],
      ["API container", "Healthy"],
      ["Health endpoint", "200 OK"],
      ["Integration tests", "8/8 passed"]
    ]
  },
  CONFIG_MISMATCH: {
    title: "Database hostname mismatch",
    prompt: "Investigate why the API cannot connect after configuration change.",
    severity: "HIGH",
    affectedService: "Configuration",
    confidence: 92,
    rootCause:
      "DATABASE_URL points to db:5432, but Docker Compose exposes the database service as postgres. The API fails during startup.",
    proposedActions: [
      {
        id: "patch-env",
        label: "Update DATABASE_URL host from db to postgres",
        command: "patch .env.local",
        risk: "MEDIUM",
        approvalRequired: true,
        diff:
          "--- .env.local\n+++ .env.local\n@@\n-DATABASE_URL=postgresql://app:********@db:5432/app\n+DATABASE_URL=postgresql://app:********@postgres:5432/app"
      },
      {
        id: "restart-api",
        label: "Rebuild and restart API",
        command: "docker compose up -d --build api",
        risk: "LOW",
        approvalRequired: true
      }
    ],
    evidence: [
      ["API logs", "getaddrinfo ENOTFOUND db"],
      ["Config comparison", ".env.local uses db; docker-compose.yml defines postgres"],
      ["Health endpoint", "HTTP 502 from reverse proxy"],
      ["Secret masking", "DATABASE_URL=postgresql://***:***@db:5432/app"]
    ],
    verification: [
      ["Configuration", "DATABASE_URL host matches compose service"],
      ["API container", "Healthy"],
      ["Health endpoint", "200 OK"],
      ["Tests", "18/18 passed"]
    ]
  },
  CODE_BUG: {
    title: "Login API failed",
    prompt: "Find why the user lookup route fails for valid numeric IDs.",
    severity: "HIGH",
    affectedService: "Application code",
    confidence: 89,
    rootCause:
      "The route passes req.params.id as a string to Prisma, while the schema expects an integer user ID.",
    proposedActions: [
      {
        id: "patch-route",
        label: "Convert route parameter to integer and validate it",
        command: "apply patch api/src/routes/users.ts",
        risk: "MEDIUM",
        approvalRequired: true,
        diff:
          "--- api/src/routes/users.ts\n+++ api/src/routes/users.ts\n@@\n-const id = req.params.id;\n+const id = Number(req.params.id);\n+\n+if (!Number.isInteger(id)) {\n+  return res.status(400).json({ error: \"Invalid user ID\" });\n+}"
      },
      {
        id: "run-tests",
        label: "Run focused API tests",
        command: "npm test -- users",
        risk: "LOW",
        approvalRequired: true
      }
    ],
    evidence: [
      ["API logs", "Prisma validation error: expected Int, received String"],
      ["Stack trace", "api/src/routes/users.ts:18"],
      ["Related code", "req.params.id is passed directly into where.id"],
      ["Test signal", "users route regression test fails before patch"]
    ],
    verification: [
      ["TypeScript", "Compilation passed"],
      ["Unit tests", "14/14 passed"],
      ["Login request", "200 OK"],
      ["Error logs", "No matching errors after fix"]
    ]
  }
};

const state = {
  activeScenario: "DATABASE_STOPPED",
  incidents: [],
  approvals: new Map(),
  repositoryScans: [],
  streams: new Map()
};

const demoRepository = {
  id: "repo-demo-commerce-api",
  projectId: project.id,
  name: "demo-commerce-api",
  url: "https://github.com/company/demo-commerce-api",
  localPath: project.rootPath,
  defaultBranch: "main"
};

const repositoryScanTemplate = {
  score: {
    overall: 78,
    security: 18,
    quality: 15,
    testing: 12,
    reliability: 13,
    documentation: 10,
    maintainability: 10
  },
  summary:
    "Repository is shippable but carries deployment risk around database configuration, authentication secrets, and missing API edge-case tests.",
  steps: [
    "Reading project structure",
    "Checking dependencies",
    "Reviewing authentication code",
    "Searching exposed secrets",
    "Detecting missing tests",
    "Inspecting recent commits"
  ],
  findings: [
    {
      severity: "CRITICAL",
      category: "Security",
      title: "Hardcoded JWT secret",
      filePath: "src/config/auth.ts",
      line: 12,
      impact: "Anyone with repository access may generate valid tokens.",
      recommendation: "Move the secret to environment variables and rotate the exposed value.",
      patch:
        "--- src/config/auth.ts\n+++ src/config/auth.ts\n@@\n-export const jwtSecret = \"demo-super-secret\";\n+export const jwtSecret = process.env.JWT_SECRET;"
    },
    {
      severity: "HIGH",
      category: "Deployment Risk",
      title: "Recent commit changed DATABASE_URL host",
      filePath: ".env.local",
      line: 3,
      impact:
        "Inside Docker, localhost points to the API container instead of PostgreSQL, causing production 502s.",
      recommendation: "Use the Docker Compose service name postgres for container-to-container database access.",
      patch:
        "--- .env.local\n+++ .env.local\n@@\n-DATABASE_URL=postgresql://app:********@localhost:5432/app\n+DATABASE_URL=postgresql://app:********@postgres:5432/app"
    },
    {
      severity: "HIGH",
      category: "Bug",
      title: "Route parameter passed to Prisma as string",
      filePath: "src/routes/users.ts",
      line: 18,
      impact: "Valid user lookup requests can fail at runtime because Prisma expects an integer ID.",
      recommendation: "Convert req.params.id to a number and reject invalid IDs with HTTP 400.",
      patch:
        "--- src/routes/users.ts\n+++ src/routes/users.ts\n@@\n-where: { id: req.params.id }\n+where: { id: Number(req.params.id) }"
    },
    {
      severity: "MEDIUM",
      category: "Missing Tests",
      title: "Login error cases are not covered",
      filePath: "tests/auth.test.ts",
      line: null,
      impact: "Invalid password, suspended account, missing email, and rate-limit paths can regress unnoticed.",
      recommendation: "Add integration tests for authentication failure and rate-limit responses.",
      patch: null
    },
    {
      severity: "MEDIUM",
      category: "Code Quality",
      title: "Payment controller has a large function",
      filePath: "src/controllers/payment.ts",
      line: 44,
      impact: "The 240-line handler is hard to test and makes payment failures harder to isolate.",
      recommendation: "Split validation, payment creation, and response formatting into focused services.",
      patch: null
    }
  ],
  recentCommits: [
    {
      sha: "a82f1c",
      message: "Update database connection handling",
      risk: "HIGH",
      reason: "Changed PostgreSQL hostname from postgres to localhost."
    },
    {
      sha: "c41e9d",
      message: "Refactor auth middleware",
      risk: "MEDIUM",
      reason: "Modified token parsing without expired-token regression tests."
    }
  ],
  prReview: {
    number: 42,
    title: "Refactor authentication middleware",
    risk: "HIGH",
    reason: "Authentication middleware changed, but no tests were added for expired tokens.",
    recommendation: "Add integration coverage before merging."
  }
};

async function initializeDatabase() {
  try {
    const module = await import("@prisma/client");
    prisma = new module.PrismaClient();
    await prisma.$connect();
    await prisma.project.upsert({
      where: { id: project.id },
      update: project,
      create: project
    });
    await prisma.repository.upsert({
      where: { id: demoRepository.id },
      update: demoRepository,
      create: demoRepository
    });
    console.log("Prisma connected to Postgres.");
  } catch (error) {
    prisma = null;
    console.log(`Prisma unavailable, using in-memory demo store: ${error.message}`);
  }
}

function json(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(body);
}

function notFound(res) {
  json(res, 404, { error: "Not found" });
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function now() {
  return new Date().toISOString();
}

function createIncident(userPrompt) {
  const scenario = scenarios[state.activeScenario];
  const incident = {
    id: `OP-${1042 + state.incidents.length}`,
    projectId: project.id,
    title: scenario.title,
    userPrompt: userPrompt || scenario.prompt,
    status: "CREATED",
    severity: scenario.severity,
    affectedService: scenario.affectedService,
    confidence: null,
    rootCause: null,
    startedAt: now(),
    resolvedAt: null,
    plan: [
      "Call the application health endpoint",
      "Inspect Docker service status",
      "Read API and proxy logs",
      "Compare runtime configuration",
      "Produce evidence-backed diagnosis"
    ],
    events: [],
    evidence: [],
    proposedActions: [],
    verification: [],
    report: ""
  };
  state.incidents.unshift(incident);
  persistIncident(incident);
  return incident;
}

function addEvent(incident, type, title, details = {}, status = "complete") {
  const event = {
    id: `${incident.id}-${incident.events.length + 1}`,
    type,
    title,
    details,
    status,
    createdAt: now()
  };
  incident.events.push(event);
  persistIncidentEvent(event);
  broadcast(incident.id, event);
  return event;
}

function broadcast(incidentId, event) {
  const clients = state.streams.get(incidentId) || [];
  for (const res of clients) {
    res.write(`event: ${event.type.toLowerCase()}\n`);
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }
}

function createApproval(incident) {
  const approval = {
    id: `APR-${Date.now()}`,
    incidentId: incident.id,
    actionType: "RECOVERY_PLAN",
    status: "PENDING",
    riskLevel: highestRisk(incident.proposedActions),
    payload: {
      actions: incident.proposedActions,
      blockedActions,
      rollbackPlan: "Snapshot current diff and restore changed files if verification fails.",
      expectedOutcome: "Services return healthy and verification checks pass."
    },
    createdAt: now(),
    decidedAt: null
  };
  state.approvals.set(approval.id, approval);
  incident.approval = approval;
  persistApproval(approval);
  return approval;
}

function persistIncident(incident) {
  if (!prisma) return;
  prisma.incident
    .upsert({
      where: { id: incident.id },
      update: {
        title: incident.title,
        userPrompt: incident.userPrompt,
        status: incident.status,
        severity: incident.severity,
        affectedService: incident.affectedService,
        confidence: incident.confidence,
        rootCause: incident.rootCause,
        report: incident.report,
        resolvedAt: incident.resolvedAt ? new Date(incident.resolvedAt) : null
      },
      create: {
        id: incident.id,
        projectId: incident.projectId,
        title: incident.title,
        userPrompt: incident.userPrompt,
        status: incident.status,
        severity: incident.severity,
        affectedService: incident.affectedService,
        confidence: incident.confidence,
        rootCause: incident.rootCause,
        report: incident.report,
        startedAt: new Date(incident.startedAt)
      }
    })
    .catch((error) => console.error(`Failed to persist incident ${incident.id}: ${error.message}`));
}

function persistIncidentEvent(event) {
  if (!prisma) return;
  const incidentId = event.id.split("-").slice(0, 2).join("-");
  prisma.incidentEvent
    .upsert({
      where: { id: event.id },
      update: {
        type: event.type,
        title: event.title,
        details: event.details,
        status: event.status
      },
      create: {
        id: event.id,
        incidentId,
        type: event.type,
        title: event.title,
        details: event.details,
        status: event.status,
        createdAt: new Date(event.createdAt)
      }
    })
    .catch((error) => console.error(`Failed to persist event ${event.id}: ${error.message}`));
}

function persistApproval(approval) {
  if (!prisma) return;
  prisma.approval
    .upsert({
      where: { id: approval.id },
      update: {
        payload: approval.payload,
        riskLevel: approval.riskLevel,
        status: approval.status,
        decidedAt: approval.decidedAt ? new Date(approval.decidedAt) : null
      },
      create: {
        id: approval.id,
        incidentId: approval.incidentId,
        actionType: approval.actionType,
        payload: approval.payload,
        riskLevel: approval.riskLevel,
        status: approval.status,
        createdAt: new Date(approval.createdAt)
      }
    })
    .catch((error) => console.error(`Failed to persist approval ${approval.id}: ${error.message}`));
}

function createRepositoryScan(repositoryInput = {}) {
  const scan = {
    id: `RS-${2200 + state.repositoryScans.length}`,
    repository: {
      ...demoRepository,
      url: repositoryInput.url || demoRepository.url,
      localPath: repositoryInput.localPath || demoRepository.localPath
    },
    status: "COMPLETED",
    startedAt: now(),
    completedAt: now(),
    score: repositoryScanTemplate.score,
    summary: repositoryScanTemplate.summary,
    steps: repositoryScanTemplate.steps,
    findings: repositoryScanTemplate.findings.map((finding, index) => ({
      id: `RF-${state.repositoryScans.length + 1}-${index + 1}`,
      ...finding
    })),
    recentCommits: repositoryScanTemplate.recentCommits,
    prReview: repositoryScanTemplate.prReview,
    incidentCorrelation: {
      incident: "API returning 502",
      commit: "a82f1c",
      explanation:
        "The production outage started after the commit that changed the PostgreSQL hostname from postgres to localhost. In Docker, localhost resolves inside the API container, so the API cannot reach Postgres."
    }
  };
  state.repositoryScans.unshift(scan);
  persistRepositoryScan(scan);
  return scan;
}

function persistRepositoryScan(scan) {
  if (!prisma) return;
  prisma.repository
    .upsert({
      where: { id: scan.repository.id },
      update: scan.repository,
      create: scan.repository
    })
    .then(() =>
      prisma.repositoryScan.upsert({
        where: { id: scan.id },
        update: {
          status: scan.status,
          overallScore: scan.score.overall,
          securityScore: scan.score.security,
          qualityScore: scan.score.quality,
          testingScore: scan.score.testing,
          reliabilityScore: scan.score.reliability,
          documentationScore: scan.score.documentation,
          maintainabilityScore: scan.score.maintainability,
          summary: scan.summary,
          completedAt: new Date(scan.completedAt)
        },
        create: {
          id: scan.id,
          repositoryId: scan.repository.id,
          status: scan.status,
          overallScore: scan.score.overall,
          securityScore: scan.score.security,
          qualityScore: scan.score.quality,
          testingScore: scan.score.testing,
          reliabilityScore: scan.score.reliability,
          documentationScore: scan.score.documentation,
          maintainabilityScore: scan.score.maintainability,
          summary: scan.summary,
          startedAt: new Date(scan.startedAt),
          completedAt: new Date(scan.completedAt)
        }
      })
    )
    .then(() =>
      Promise.all(
        scan.findings.map((finding) =>
          prisma.repositoryFinding.upsert({
            where: { id: finding.id },
            update: {
              severity: finding.severity,
              category: finding.category,
              title: finding.title,
              filePath: finding.filePath,
              line: finding.line,
              impact: finding.impact,
              recommendation: finding.recommendation,
              patch: finding.patch
            },
            create: {
              id: finding.id,
              scanId: scan.id,
              severity: finding.severity,
              category: finding.category,
              title: finding.title,
              filePath: finding.filePath,
              line: finding.line,
              impact: finding.impact,
              recommendation: finding.recommendation,
              patch: finding.patch
            }
          })
        )
      )
    )
    .catch((error) => console.error(`Failed to persist repository scan ${scan.id}: ${error.message}`));
}

function highestRisk(actions) {
  if (actions.some((action) => action.risk === "HIGH")) return "HIGH";
  if (actions.some((action) => action.risk === "MEDIUM")) return "MEDIUM";
  return "LOW";
}

function buildReport(incident) {
  const evidence = incident.evidence.map((item) => `- ${item.title}: ${item.detail}`).join("\n");
  const commands = incident.proposedActions.map((item) => `- ${item.command}`).join("\n");
  const verification = incident.verification.map((item) => `- ${item.check}: ${item.result}`).join("\n");
  return `# ${incident.id}: ${incident.title}

## Summary
${incident.rootCause}

## Impact
Severity: ${incident.severity}
Affected service: ${incident.affectedService}

## Evidence
${evidence}

## Resolution
OpsPilot requested human approval, executed the approved recovery plan, and verified service recovery.

## Commands / Changes
${commands}

## Verification
${verification}

## Prevention
Add dependency readiness checks, keep configuration names aligned with Docker Compose services, and include regression tests for incident-prone routes.
`;
}

async function runInvestigation(incident) {
  const scenario = scenarios[state.activeScenario];
  incident.status = "PLANNING";
  persistIncident(incident);
  addEvent(incident, "PLAN", "Investigation plan created", { steps: incident.plan });
  await pause(350);

  incident.status = "INVESTIGATING";
  persistIncident(incident);
  for (const [title, detail] of scenario.evidence) {
    addEvent(incident, "TOOL_CALL", `Running ${title.toLowerCase()}`, { readOnly: true });
    await pause(500);
    const evidence = { id: `E${incident.evidence.length + 1}`, title, detail };
    incident.evidence.push(evidence);
    addEvent(incident, "EVIDENCE", title, evidence);
    await pause(350);
  }

  incident.status = "DIAGNOSED";
  incident.rootCause = scenario.rootCause;
  incident.confidence = scenario.confidence;
  persistIncident(incident);
  addEvent(incident, "DIAGNOSIS", "Root cause identified", {
    rootCause: scenario.rootCause,
    confidence: scenario.confidence,
    severity: scenario.severity,
    evidenceIds: incident.evidence.map((item) => item.id)
  });
  await pause(450);

  incident.status = "AWAITING_APPROVAL";
  incident.proposedActions = scenario.proposedActions;
  persistIncident(incident);
  const approval = createApproval(incident);
  addEvent(incident, "APPROVAL_REQUEST", "Human approval required", approval, "pending");
}

async function executeApproval(approval) {
  const incident = state.incidents.find((item) => item.id === approval.incidentId);
  if (!incident) return null;
  const scenario = scenarios[state.activeScenario];
  incident.status = "EXECUTING";
  persistIncident(incident);
  addEvent(incident, "EXECUTION", "Approval received", { approvalId: approval.id });

  for (const action of incident.proposedActions) {
    await pause(600);
    addEvent(incident, "EXECUTION", action.label, {
      command: action.command,
      risk: action.risk,
      result: "completed"
    });
  }

  incident.status = "VERIFYING";
  persistIncident(incident);
  addEvent(incident, "VERIFICATION", "Recovery verification started", {});
  for (const [check, result] of scenario.verification) {
    await pause(450);
    const verification = { check, result };
    incident.verification.push(verification);
    addEvent(incident, "VERIFICATION", check, verification);
  }

  incident.status = "RESOLVED";
  incident.resolvedAt = now();
  incident.report = buildReport(incident);
  persistIncident(incident);
  addEvent(incident, "INCIDENT_RESOLVED", "System recovered", {
    resolvedAt: incident.resolvedAt,
    report: incident.report
  });
  return incident;
}

function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function serveStatic(req, res) {
  const requestPath = req.url === "/" ? "/index.html" : decodeURIComponent(req.url);
  const resolved = path.normalize(path.join(publicDir, requestPath));
  if (!resolved.startsWith(publicDir) || !existsSync(resolved)) return notFound(res);
  const ext = path.extname(resolved);
  const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml"
  };
  res.writeHead(200, { "content-type": contentTypes[ext] || "application/octet-stream" });
  res.end(await readFile(resolved));
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/api/projects") return json(res, 200, [project]);
    if (req.method === "GET" && url.pathname === "/api/projects/demo-commerce-api/health") {
      return json(res, 200, {
        application: state.activeScenario === "DATABASE_STOPPED" ? "Down" : "Degraded",
        database: state.activeScenario === "DATABASE_STOPPED" ? "Stopped" : "Healthy",
        redis: "Healthy",
        proxy: "Degraded",
        repositoryHealth: state.repositoryScans[0]?.score.overall || 78,
        criticalCodeIssues: state.repositoryScans[0]?.findings.filter((item) => item.severity === "CRITICAL").length || 1,
        riskyPrs: 1,
        lastCheckedAt: now()
      });
    }

    if (req.method === "GET" && url.pathname === "/api/repositories") {
      return json(res, 200, [demoRepository]);
    }

    if (req.method === "GET" && url.pathname === "/api/repositories/scans") {
      return json(res, 200, state.repositoryScans);
    }

    if (req.method === "POST" && url.pathname === "/api/repositories/scan") {
      const body = await readBody(req);
      const scan = createRepositoryScan(body);
      return json(res, 201, scan);
    }

    const scanMatch = url.pathname.match(/^\/api\/repositories\/scans\/([^/]+)$/);
    if (req.method === "GET" && scanMatch) {
      const scan = state.repositoryScans.find((item) => item.id === scanMatch[1]);
      return scan ? json(res, 200, scan) : notFound(res);
    }

    if (req.method === "GET" && url.pathname === "/api/incidents") return json(res, 200, state.incidents);
    if (req.method === "POST" && url.pathname === "/api/incidents") {
      const body = await readBody(req);
      const incident = createIncident(body.prompt);
      json(res, 201, incident);
      runInvestigation(incident);
      return;
    }

    const incidentMatch = url.pathname.match(/^\/api\/incidents\/([^/]+)$/);
    if (req.method === "GET" && incidentMatch) {
      const incident = state.incidents.find((item) => item.id === incidentMatch[1]);
      return incident ? json(res, 200, incident) : notFound(res);
    }

    const reportMatch = url.pathname.match(/^\/api\/incidents\/([^/]+)\/report$/);
    if (req.method === "GET" && reportMatch) {
      const incident = state.incidents.find((item) => item.id === reportMatch[1]);
      return incident ? json(res, 200, { markdown: incident.report || buildReport(incident) }) : notFound(res);
    }

    const streamMatch = url.pathname.match(/^\/api\/incidents\/([^/]+)\/stream$/);
    if (req.method === "GET" && streamMatch) {
      const incidentId = streamMatch[1];
      res.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive"
      });
      const clients = state.streams.get(incidentId) || [];
      clients.push(res);
      state.streams.set(incidentId, clients);
      req.on("close", () => {
        state.streams.set(
          incidentId,
          (state.streams.get(incidentId) || []).filter((client) => client !== res)
        );
      });
      return;
    }

    const approveMatch = url.pathname.match(/^\/api\/approvals\/([^/]+)\/approve$/);
    if (req.method === "POST" && approveMatch) {
      const approval = state.approvals.get(approveMatch[1]);
      if (!approval) return notFound(res);
      approval.status = "APPROVED";
      approval.decidedAt = now();
      persistApproval(approval);
      json(res, 200, approval);
      executeApproval(approval);
      return;
    }

    const rejectMatch = url.pathname.match(/^\/api\/approvals\/([^/]+)\/reject$/);
    if (req.method === "POST" && rejectMatch) {
      const approval = state.approvals.get(rejectMatch[1]);
      if (!approval) return notFound(res);
      approval.status = "REJECTED";
      approval.decidedAt = now();
      persistApproval(approval);
      const incident = state.incidents.find((item) => item.id === approval.incidentId);
      if (incident) {
        incident.status = "FAILED";
        persistIncident(incident);
        addEvent(incident, "ERROR", "Recovery plan rejected", { approvalId: approval.id }, "failed");
      }
      return json(res, 200, approval);
    }

    if (req.method === "POST" && url.pathname === "/api/demo/inject-failure") {
      const body = await readBody(req);
      if (!scenarios[body.scenario]) return json(res, 400, { error: "Unknown demo scenario" });
      state.activeScenario = body.scenario;
      return json(res, 200, { activeScenario: state.activeScenario, scenario: scenarios[state.activeScenario] });
    }

    if (req.method === "POST" && url.pathname === "/api/demo/reset") {
      state.activeScenario = "DATABASE_STOPPED";
      state.incidents = [];
      state.approvals.clear();
      state.repositoryScans = [];
      return json(res, 200, { ok: true, activeScenario: state.activeScenario });
    }

    if (req.method === "GET" && !url.pathname.startsWith("/api/")) return serveStatic(req, res);
    return notFound(res);
  } catch (error) {
    json(res, 500, { error: error.message });
  }
});

initializeDatabase().finally(() => {
  server.listen(port, host, () => {
    console.log(`OpsPilot AI is running at http://${host}:${port}`);
  });
});
