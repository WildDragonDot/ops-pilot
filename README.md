# D-OpsPilot AI (DOP) 🚀

> **Autonomous SRE & AI Incident Commander with WebCrypto Security Architecture**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build: Passing](https://img.shields.io/badge/Build-Passing-emerald.svg)]()
[![Security: WebCrypto--AES--256](https://img.shields.io/badge/Security-Zero--Knowledge--WebCrypto-purple.svg)]()
[![AI Engine: Gemini--3.6--Flash--&--GPT--4o](https://img.shields.io/badge/AI--Engine-Gemini--3.6--Flash--%26--GPT--4o-amber.svg)]()
[![Mobile Ready](https://img.shields.io/badge/Mobile-Fully%20Responsive-green.svg)]()
[![Target Host: Production Server](https://img.shields.io/badge/Target--Host-dopspilot.chandandev.online-blue.svg)](https://dopspilot.chandandev.online)

D-OpsPilot AI is an enterprise-grade, evidence-driven autonomous DevOps & SRE AI Agent. It bridges production operations with intelligence — inspecting live microservice container logs, diagnosing complex root-cause outages, correlating recent git commits with failures, executing zero-downtime deployments, and automating server health verification with human-in-the-loop safety guardrails.

> [!IMPORTANT]
> 🔒 **Zero-Knowledge & Privacy Guarantee**:
> **NO SSH Keys, Passwords, GitHub Personal Access Tokens, or AI API Keys are EVER stored on our backend server or in any database.**
> All credentials remain **100% strictly local** on the user's browser using AES-256 WebCrypto vault encryption. We cannot view, access, store, or log your keys.

---

## 📽️ System Architecture

```mermaid
graph TD
    User([👨‍💻 SRE / Developer UI]) -->|AES-256 WebCrypto Local Vault| Frontend[⚡ React + Vite + Tailwind Dashboard]
    Frontend -->|REST API / SSE Event Stream| Backend[🚀 Node.js + Express + Prisma Engine]
    
    subgraph AI Intelligence Core
        Backend <-->|Function Calling & Multi-Key Failover| Gemini[✨ Google Gemini 3.6 Flash / Pro]
        Backend <-->|AST Code Audit & Reasoning| OpenAI[🤖 OpenAI GPT-4o Codex Engine]
        Backend <-->|Deterministic Local Fallback| FallbackAI[⚡ System Heuristic Engine]
    end
    
    subgraph Zero-DB Security Shield
        Backend <-->|Prisma ORM| DB[(SQLite / PostgreSQL DB - Zero Plaintext Keys)]
        Backend -->|Strict Guardrails| Policy[🛡️ Forbidden Commands Security Filter]
    end
    
    subgraph Target Production Infrastructure: dopspilot.chandandev.online
        Backend -->|Encrypted SSH2 Tunnel| Host[🐧 Ubuntu 26.04 AWS Server]
        Host --> Docker[🐳 Docker Microservices Engine]
        Docker --> PG[(PostgreSQL Database)]
        Docker --> Redis[(Redis Cache)]
        Docker --> Microservices[⚙️ Node.js / Go Microservices]
        Docker --> Nginx[🌐 Nginx Reverse Proxy]
    end
```

---

## ⚙️ Core Working Mechanism

1. **Client-Side WebCrypto Vault & Zero-Knowledge Privacy**:
   - Server SSH private keys, passwords, and GitHub access tokens are encrypted inside the user's browser using AES-256 WebCrypto.
   - **Zero Credentials on Server/DB**: Credentials are **NEVER stored, persisted, or logged** in backend databases or server files. They reside exclusively on your local device.
   - Plain-text credentials are passed transiently in memory only during authorized SSH execution and immediately destroyed.

2. **Dynamic Key Handling & Isolated Temp Files**:
   - Raw PEM keys (`-----BEGIN OPENSSH PRIVATE KEY-----`) are written transiently to isolated temporary files with strict `0600` permissions.
   - Keys are automatically unlinked (deleted) from disk immediately upon command execution completion.
   - Automatically resolves file path references (`~/.ssh/id_rsa_no_pass`) and falls back to host system default keys.

3. **ANSI & VT100 Control Sequence Sanitizer**:
   - Automatic ANSI escape sequence stripper filters out terminal formatting characters (`\x1b[?1049h`, `\x1b[22;0;0t`).
   - Terminal monitoring outputs (`htop`, `top`, `docker ps`, `free -m`) render clean, human-readable text tables.

4. **Automated Workspace Storage Purger**:
   - Deleting a project workspace automatically deletes its local cloned git repository directory (`backend/data/cloned_repos/<id>`).
   - Background cleanup auto-purges any orphaned or inactive workspaces older than 3 days.

5. **Human-in-the-Loop Safety Approvals**:
   - High-risk operations (service restarts, code deployments, database modifications) pause for explicit operator sign-off with unified diff previews.

---

## 🌟 Complete System Features Breakdown

### 🔒 0. Client Security Vault & Zero-Knowledge Guarantee
- **Local Storage Only**: Keys, tokens, and credentials remain in your local browser vault.
- **No Database Persistence**: Neither database nor backend logs contain any user keys or secret tokens.
- **Complete Privacy**: Zero remote exposure — we cannot see, access, or intercept your keys.

### 🤖 1. Autonomous AI Incident Commander & Root Cause Diagnosis
- **Outage Diagnosis**: Automatically diagnoses production failures including `502 Bad Gateway`, PostgreSQL connection limits, memory leaks, and Nginx proxy errors.
- **Multi-Model Key Failover**: Intelligently rotates across Gemini & OpenAI API keys with auto-recovery from rate limits or quota exhaustion.
- **Evidence-Based Reasoning**: Gathers live logs, container states, and system metrics before generating root-cause reports.

### 📦 2. 1-Click Autonomous AI Deployment Pipeline
- **Commit Gap Detector**: Compares latest GitHub `main` commit hash against the running server commit.
- **Zero-Downtime Pipeline**: Automates git sync, dependency installation, build step, container restart, and Nginx reload.
- **Automated Health Verification**: Sends HTTP GET verification pings post-deployment to confirm HTTP 200 OK service status.

### 💻 3. Interactive Web SSH Terminal & AI Command Copilot
- **Live SSH Shell**: Real-time interactive remote server terminal directly in your web browser.
- **AI Command Copilot Drawer**: Translates natural language questions (in English/Hindi, e.g., *"check error log in docker"*, *"mera server setup kya h"*) into verified bash commands.
- **Preset Toolbar**: 1-Click preset buttons for `docker ps`, `curl health`, `free -m`, `uptime`, `git status`, `ls -la`.
- **Command Interceptor**: Blocks dangerous operations (`rm -rf /`, `mkfs`, `reboot`, fork bombs).

### 🛡️ 4. Microservices Dynamic Chaos Engine
- **Stack Auto-Detection**: Detects active microservices stack (Node.js, Go, PostgreSQL, Redis, Nginx, Docker).
- **Failure Injection**: Simulates database connection timeouts, secret mismatches, panics, and key eviction bottlenecks.
- **AI Suggest Stack Scenarios**: One-click AI generator proposes tailored fault scenarios based on live system architecture.

### 🕵️ 5. GitHub AST Code & Security Auditor
- **Secret Scanner**: Identifies plain-text API keys, AWS credentials, and hardcoded secrets in source files and commit history.
- **Dependency Vulnerability Audit**: Scans package manifests for CVE vulnerabilities and outdated packages.
- **Endpoint Safety Auditor**: Traces API controllers for type mismatches, missing parameter validations, and unhandled promises.

### ⏸️ 6. Human-in-the-Loop Safety Approval Queue
- **Operator Sign-Off**: Mandatory approval gate before executing write actions or server patches.
- **Diff & Risk Inspection**: Displays exact bash commands, threat classification (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), rollback strategy, and code diffs.

### 📊 7. Real-Time SSE Log Streaming & Visual Topology Graph
- **Server-Sent Events (SSE)**: Streams live command execution, terminal output, and incident event timelines.
- **Interactive Microservices Topology**: Visual SVG graph illustrating service node health, open ports, latency, and container relationships.

### 🔐 8. Role-Based Access Control (RBAC) & Audit Logs
- **Role Hierarchy**: Enforces permissions across `ADMIN`, `OPERATOR`, and `VIEWER` roles.
- **System Audit Trail**: Logs user email, IP address, timestamp, category, action, and target resource for every operation.

### 📚 9. Automated SRE Runbooks Execution Library
- **Pre-Built Operations**: Library of verified operational procedures for database vacuuming, cache invalidation, disk space reclamation, and security posture checks.
- **Parametrized Execution**: Triggers runbook steps directly on remote servers with step-by-step verification logs.

### 📝 10. AI Post-Mortem Incident Reports Generator
- **Automated Root-Cause Reports**: Generates structured post-mortem incident reports complete with incident timeline, impact metrics, root cause analysis, and preventive recommendations.
- **Export & Share**: Shareable incident reports for team post-mortems and compliance documentation.

### 📱 11. Mobile-First Fully Responsive UI — Audit Anywhere, Anytime

> **No laptop? No problem.** D-OpsPilot AI is fully usable from your smartphone or tablet.

- **Full Mobile Support**: The entire dashboard, audit workflows, incident commander, and SSH terminal UI are optimized for small screen mobile devices (375px+) and tablet viewports without any feature loss.
- **Audit GitHub from Your Phone**: Run a full AI-powered code security scan on any GitHub repository directly from your mobile browser — no laptop needed.
- **Monitor & Fix Production Servers on Mobile**: Check live server health, stream real-time logs, trigger container restarts, and review AI incident diagnoses — all from your phone.
- **On-the-Go Incident Response**: Get alerted, diagnose root cause, and approve or reject high-risk AI operations from your mobile device during off-hours without opening a laptop.
- **Responsive Navigation Drawer**: Tap the hamburger menu on mobile to open the full navigation sidebar as a smooth animated drawer — identical desktop feature parity on small screens.
- **Touch-Friendly Controls**: All buttons, tabs, and interactive controls are sized and spaced for comfortable touch interaction.

---

## 🛠️ Installation & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: Installed locally

### 1. Clone the Repository
```bash
git clone https://github.com/WildDragonDot/ops-pilot.git
cd ops-pilot
```

### 2. Install Dependencies
```bash
# Install root, backend, and frontend dependencies
npm install && cd backend && npm install && cd ../frontend && npm install && cd ..
```

### 3. Configure Environment

Create `.env` inside `backend/`:
```env
PORT=5080
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"
GEMINI_API_KEY="your-google-gemini-api-key"
OPENAI_API_KEY="your-openai-api-key"
```

Initialize Prisma database:
```bash
cd backend
npx prisma db push
cd ..
```

---

## 🚀 Running the Application

### Option A: One-Command Start (Recommended)
```bash
./start.sh
```
Launches both **Backend Service (port 5080)** and **Frontend Dashboard (port 5173 / 3000)** simultaneously.

Web Dashboard: **`http://localhost:5173`** or **`http://localhost:3000`**

### Option B: Manual Start

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Stopping the Application
```bash
./stop.sh
```

---

## 🧪 Testing & Verification Guide

D-OpsPilot AI includes an End-to-End Master Test Suite covering 5 major system areas:

```bash
cd backend
npm test
```

### Test Execution Scope:
1. **Authentication & RBAC Suite**: Password hashing, JWT token issuance, role hierarchy.
2. **Project Management & Server Discovery**: Host parsing, command injection guardrails, directory traversal protection.
3. **AI Intelligence & Activities Suite**: Prompt reasoning, AST code auditing, outage detection, log analysis.
4. **Repository Auditor & AST Code Scan**: GitHub URL parsing, rate-limit response handling, secret scanning.
5. **Incidents & Safety Approval Queue**: Incident scenarios, failure injection state transitions, environment reset.

Typechecking:
```bash
# Backend
cd backend && npx tsc --noEmit

# Frontend
cd frontend && npx tsc --noEmit
```

---

## 🌐 Production Server Deployment

Deploy changes to production server `ubuntu@<YOUR_SERVER_IP>`:

```bash
./deploy-to-server.sh
```

Deployment Script Steps:
1. Verifies SSH connectivity to target production server.
2. Syncs backend and frontend source files via SCP.
3. Compiles backend TypeScript (`tsc`) and restarts PM2 (`opspilot-backend`).
4. Builds Vite production bundle (`vite build`) and reloads Nginx proxy.
5. Runs `/api/health` verification test.

Live Application URL: **`https://dopspilot.chandandev.online`**

---

## ❓ Frequently Asked Questions (FAQ) & Troubleshooting

### Q1. What if SSH connection fails with `SSH AUTH FAILED` or `Permission Denied`?
- Verify that your remote server Security Group inbound rules allow SSH port `22` from `0.0.0.0/0` (or your IP).
- Make sure the SSH username is correct (e.g. `ubuntu` for AWS EC2 Ubuntu instances, `root` for DigitalOcean).
- If pasting a private key, ensure it includes headers: `-----BEGIN OPENSSH PRIVATE KEY-----` or `-----BEGIN RSA PRIVATE KEY-----`.
- If using local key files, specify the key name e.g. `id_rsa_no_pass` or path `~/.ssh/id_rsa_no_pass`.

### Q2. What if GitHub API rate limit is exceeded during repository audit?
- Open **Project Settings** or **Project Setup Modal** and provide a GitHub Personal Access Token (PAT).
- The system automatically sends the PAT in request headers for authenticated GitHub API calls.

### Q3. How does AI key failover work if an API quota is reached?
- D-OpsPilot AI monitors Gemini and OpenAI key health.
- If key quota/rate limit error (HTTP 429) occurs, it automatically rotates to the next available system key or switches to local heuristic reasoning without failing the request.

---

## 💡 Useful Production Operations Commands

```bash
# View backend application logs on production server
ssh -i ~/.ssh/id_rsa_no_pass ubuntu@<YOUR_SERVER_IP> 'pm2 logs opspilot-backend'

# Restart backend service
ssh -i ~/.ssh/id_rsa_no_pass ubuntu@<YOUR_SERVER_IP> 'pm2 restart opspilot-backend'

# View Nginx access & error logs
ssh -i ~/.ssh/id_rsa_no_pass ubuntu@<YOUR_SERVER_IP> 'sudo tail -f /var/log/nginx/error.log'

# Reload Nginx server configuration
ssh -i ~/.ssh/id_rsa_no_pass ubuntu@<YOUR_SERVER_IP> 'sudo systemctl reload nginx'
```

---

## 📡 REST API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `GET /api/health` | `GET` | Backend health check status |
| `GET /api/projects` | `GET` | Fetch all configured projects |
| `POST /api/projects` | `POST` | Create a new project workspace |
| `DELETE /api/projects/:id` | `DELETE` | Delete project workspace & purge local cloned repos |
| `POST /api/projects/test-connection` | `POST` | Validate SSH server and GitHub credentials |
| `POST /api/server/execute` | `POST` | Execute authenticated remote SSH shell command |
| `POST /api/incidents` | `POST` | Trigger AI incident investigation loop |
| `GET /api/incidents/:id/stream` | `GET` | Real-time Server-Sent Events (SSE) log stream |
| `POST /api/approvals/:id/approve` | `POST` | Operator approval sign-off for recovery patch |
| `POST /api/repo/audit` | `POST` | Trigger repository AST security & vulnerability scan |

---

## 🛡️ Security Guardrails & Intercepted Commands

D-OpsPilot AI strictly intercepts dangerous operations at both API and SSH execution layers:
- ❌ `rm -rf /` or `rm -r /` (File system deletion)
- ❌ `mkfs` or `dd if=` (Disk partition formatting)
- ❌ `:(){ :|:& };:` (Fork bombs)
- ❌ `shutdown`, `reboot`, `poweroff` (Server shutdown)

---

## 📄 License & Credits

Developed with ❤️ by **Chandan Vishwakarma (WildDragon)**. Licensed under [MIT License](LICENSE).
