# OpsPilot AI Architecture

## Current MVP

The current build is a self-contained local demo:

```text
Browser dashboard
      |
      | REST + Server-Sent Events
      v
Node HTTP server
      |
      | deterministic incident and repository engines
      v
Postgres through Prisma
      |
      v
Incident timeline, repository findings, approval, verification, report
```

The server deliberately avoids arbitrary command execution. Scenario actions are simulated from an allowlisted recovery plan so the demo can show the complete workflow safely.

## Intended Production Shape

```text
Next.js dashboard
      |
      | REST + SSE
      v
Express API
      |
      | incident agent, repository review agent, PR review service, git analysis service, policy engine
      v
OpenAI structured tool calls + local tool executor + Postgres/Prisma
      |
      | allowlisted tools only
      v
GitHub API, local Git repository, Docker, PM2, Nginx, health endpoints, tests, reports
```

## Repository Intelligence Loop

1. Connect a local repository path or public GitHub URL.
2. Read project structure, dependencies, recent commits, and high-risk source paths.
3. Detect security risks, code-quality issues, possible bugs, missing tests, documentation gaps, and deployment risks.
4. Produce a weighted repository health score.
5. Correlate risky commits with production incidents when symptoms match changed files or configuration.
6. Generate suggested patches only after presenting evidence and risk.

## Incident Agent Loop

1. Create an investigation plan from the project context and user prompt.
2. Prefer read-only tools: health checks, service status, logs, file reads, code search, Git status, and recent repository findings.
3. Store every finding as structured evidence.
4. Produce a diagnosis that cites evidence IDs.
5. Build a recovery proposal with exact commands or file diffs.
6. Pause for human approval before any write action.
7. Execute approved actions only.
8. Verify health, tests, dependency connectivity, and logs.
9. Generate a Markdown incident report.

## Safety Rules

- Never expose secret values in UI or model context.
- Never run arbitrary shell commands.
- Restrict file access to the connected repository root.
- Require approval for restarts, rebuilds, patches, config edits, and tests.
- Block destructive actions in the MVP.
- Record an audit trail for every tool call and approval decision.

## Database

The app uses Postgres with Prisma. The schema stores:

- Projects and connected repositories.
- Incidents, timeline events, approvals, and generated reports.
- Repository scans and findings with severity, category, file path, line, impact, recommendation, and optional patch.
