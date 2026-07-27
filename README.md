# OpsPilot AI

OpsPilot AI is an evidence-driven engineering agent for production incidents and GitHub repository intelligence. It reviews repository risks, investigates failures across health checks, service status, logs, configuration, commits, code signals, and tests, then pauses for human approval before executing any recovery action.

## Product Overview

OpsPilot is designed for backend developers, full-stack developers, DevOps engineers, startup teams, and technical support engineers who need a controlled way to debug production incidents without jumping between dashboards, terminals, logs, Docker, Git, and Postman.

One-line pitch:

> OpsPilot AI reviews your GitHub repository, investigates production failures, applies approved fixes, and verifies recovery.

The product has three pillars:

- Prevent: scan repositories for security, quality, test, dependency, documentation, and deployment risks.
- Resolve: investigate production incidents with real evidence and recent-code correlation.
- Learn: generate incident reports and prevention recommendations after recovery.

## MVP Features

- Project command center with health status for application, database, Redis, and proxy.
- GitHub Checker dashboard with repository score, security findings, bug risks, missing tests, commit risk, and PR review.
- Natural-language incident prompt plus quick commands.
- Three deterministic demo scenarios: stopped database, configuration mismatch, and application code bug.
- Live incident timeline for plan, tool calls, evidence, diagnosis, approval, execution, and verification.
- Human approval modal with risk level, commands, rollback plan, and diff preview.
- Recovery verification before marking an incident resolved.
- Markdown incident report with impact, evidence, resolution, commands, verification, and prevention.
- Safety-first command policy that blocks destructive classes of action in the MVP.

## Architecture

This repository is intentionally dependency-light so judges can run it quickly:

- `server/index.js` provides the HTTP API, static file server, incident state machine, repository scan engine, approval flow, Prisma persistence, and SSE event stream.
- `public/index.html`, `public/styles.css`, and `public/app.js` provide the dark developer-tool dashboard.
- `prisma/schema.prisma` defines the Postgres-backed data model for projects, incidents, approvals, repositories, scans, and findings.
- `docs/architecture.md` captures the intended production architecture for the full Next.js plus Express plus Postgres/Prisma version.

The MVP uses deterministic scenario data instead of arbitrary shell execution. This keeps the hackathon demo safe while preserving the core product behavior: visible evidence, root-cause analysis, approval, execution timeline, verification, and report.

## Local Installation

Requirements:

- Node.js 18 or newer
- Docker, if you want the local Postgres database

Install dependencies:

```bash
npm install
```

Start Postgres and prepare Prisma:

```bash
docker compose up -d postgres
cp .env.example .env
npm run db:generate
npm run db:push
```

Run the app:

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:4173
```

## Demo Flow

1. Click `Scan repository` to generate the GitHub Checker health score and findings.
2. Review the risky commit that changed database connection handling.
3. Choose a production failure scenario from the top-right selector.
4. Click `Investigate outage`.
5. Watch OpsPilot correlate health checks, logs, service status, and repository risk.
6. Review the root cause and approval modal.
7. Click `Approve and execute`.
8. Confirm recovery verification and open the generated report.

## API Endpoints

- `GET /api/projects`
- `GET /api/projects/demo-commerce-api/health`
- `GET /api/repositories`
- `GET /api/repositories/scans`
- `POST /api/repositories/scan`
- `GET /api/repositories/scans/:id`
- `POST /api/incidents`
- `GET /api/incidents`
- `GET /api/incidents/:id`
- `GET /api/incidents/:id/stream`
- `POST /api/approvals/:id/approve`
- `POST /api/approvals/:id/reject`
- `GET /api/incidents/:id/report`
- `POST /api/demo/inject-failure`
- `POST /api/demo/reset`

## Safety Model

Read-only actions are allowed in the investigation phase. Low-risk write actions, such as service restarts or code patches, require approval. High-risk actions are blocked in the MVP, including file deletion, Docker volume deletion, database writes, force Git reset, firewall changes, and production deployment.

## Future Roadmap

- Replace deterministic scenario data with registered local tools.
- Add OpenAI structured tool calling with strict schemas.
- Connect a real Docker Compose demo environment.
- Add rollback snapshots and report export.
- Add real GitHub clone/API support, PR comments, SSH, PM2, Slack, and CI/CD integrations after the core loop is proven.
