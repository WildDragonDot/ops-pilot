# D-OpsPilot AI (DOP) 🚀

> **Autonomous Incident Commander & Zero-DB Security Architecture**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build: Passing](https://img.shields.io/badge/Build-Passing-emerald.svg)]()
[![Security: Zero--DB--Vault](https://img.shields.io/badge/Security-Zero--DB--Vault-purple.svg)]()
[![AI Engine: GPT--4o--Codex](https://img.shields.io/badge/AI--Engine-GPT--4o--Codex-amber.svg)]()
[![Target Host: Ubuntu--22.04](https://img.shields.io/badge/Target--Host-34.224.80.31-blue.svg)]()

D-OpsPilot AI is an evidence-driven, autonomous engineering agent designed for production incidents, real-time microservices management, and GitHub repository intelligence. It inspects live container logs, traces root cause failures across health checks, correlates recent commits with outages, and executes recovery actions with human-in-the-loop safety guardrails.

---

## 📽️ System Architecture

```mermaid
graph TD
    User([👨‍💻 SRE / Developer UI]) -->|AES-256 WebCrypto Vault| Frontend[⚡ React + Vite Dashboard]
    Frontend -->|REST API / SSE Streams| Backend[🚀 Node.js + Express Backend]
    
    subgraph AI Intelligence Layer
        Backend <-->|Function Calling / AST Audit| OpenAI[🤖 OpenAI GPT-4o Codex Engine]
        Backend <-->|Deterministic Reasoning| FallbackAI[⚡ High-Precision Local AI Engine]
    end
    
    subgraph Zero-DB Security Shield
        Backend <-->|Prisma ORM| Postgres[(DB: Incidents & Audits)]
        Backend -->|Strict Command Shield| Policy[🛡️ Forbidden Commands Filter]
    end
    
    subgraph Target Production Host: 34.224.80.31
        Backend -->|Encrypted SSH2 Tunnel| Host[🐧 Ubuntu 22.04 Server]
        Host --> Docker[🐳 Docker Compose Microservices]
        Docker --> PG[(PostgreSQL 15)]
        Docker --> Redis[(Redis 7)]
        Docker --> NanoMDM[⚙️ MicroMDM NanoMDM / NanoDEP]
        Docker --> Nginx[🌐 Nginx Proxy]
    end
```

---

## 🌟 Comprehensive Feature Highlights

### 1. 🚀 Autonomous AI Deployment & Health Verification
- **Commit Gap Detection**: Automatically compares the latest GitHub repository commit (`main`) against the live running commit on the production server (`34.224.80.31`).
- **1-Click AI Deployment**: Triggers automated deployment pipeline (`git pull origin main && npm run build && docker compose up -d`).
- **HTTP 200 Verification**: Automatically tests application endpoints and verifies service health post-deployment.

### 2. 🛡️ Dynamic Tech-Stack Chaos Engine
- **AI-Generated Scenarios**: Tailors outage simulation scenarios specifically to your project's active tech stack (e.g. `Node.js 20`, `Go Microservices`, `PostgreSQL 15`, `Redis 7`).
- **Live Failure Testing**: Simulate database connection limits, microservice ENV secret mismatches, Go handler panics, and Redis key eviction bottlenecks.
- **✨ `AI Suggest Stack Scenarios`**: One-click AI analysis button to auto-detect system components and propose custom chaos tests.

### 3. 🔒 Zero-DB Client Security Vault
- **Client-Side Encryption**: Server SSH private keys and GitHub PAT tokens are encrypted in the browser using AES-256 WebCrypto.
- **Zero Backend Exposure**: Sensitive credentials NEVER touch the backend database or logs, guaranteeing SOC2-grade security.

### 4. 📁 Multi-Project Global Header Navigation
- **Top Header Selector**: Seamlessly switch active target paths (`/home/ubuntu/finance-lock`, `/var/www/my-app`, etc.) directly from the global navigation header.
- **Local Path Sanitization**: Automatically filters out local Mac/Windows paths (`/Users/...`) to prevent accidental local overrides.
- **Vacant Path Empty State**: Displays an interactive empty state card with a 1-Click return button when switching to unpopulated server paths.

### 5. 🕵️ GitHub Repository Security & AST Auditor
- **Secret & Credential Audit**: Scans source files and commit logs for leaked API keys, database credentials, and plain-text secrets.
- **Dependency CVE Scanner**: Audits package manifests for vulnerable dependencies and outdated libraries.
- **Parameter Validation Auditor**: Traces controller code to identify string-to-integer query mismatches and unvalidated endpoints.

### 6. ⏸️ Human-in-the-Loop Safety Approval Queue
- **Mandatory Operator Sign-off**: Pauses execution before taking any write action, service restart, database update, or code patch.
- **Diff & Risk Inspection**: Displays exact bash commands, risk levels (LOW, MEDIUM, HIGH, CRITICAL), rollback strategies, and unified git diff previews.

### 7. 📊 Streaming Terminal Console & Visual Topology Graph
- **Live SSE Event Stream**: Streams real-time SSH command outputs, container logs, and diagnostic event timelines.
- **Interactive Container Topology**: Visualizes microservice node health (PostgreSQL, Redis, NanoMDM, NanoDEP, Nginx) with latency and port mappings.

### 8. 🛑 One-Command Process Management (`./start.sh` & `./stop.sh`)
- **Automated Dev Environment**: Easily start both frontend (port 3000) and backend (port 5080) in a single command.
- **Instant Silent Shutdown**: `./stop.sh` cleanly terminates watcher processes and frees ports without lingering background jobs.

---

## 🏆 Hackathon Alignment & Tracks

| Track | Integration & Feature Proof |
| :--- | :--- |
| **Track 1: Agentic Coding** | Autonomous reasoning loop with tool calling, AST patch generation, and git commit push verification. |
| **Track 2: Domain Agents & SRE Automation** | Automated root cause analysis, live server SSH execution, container diagnostics, and post-mortem report generation. |
| **Track 3: AI for Bharat Businesses & Cloud Infrastructure** | Zero-downtime deployment automation, low-bandwidth SSE log streaming, and zero-trust security vault for enterprise servers. |

---

## 🛠️ Quick Start & Local Setup

### Prerequisites
- Node.js 18 or newer
- Git & npm

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/WildDragonDot/ops-pilot.git
cd ops-pilot

# Install root & workspace dependencies
npm install
```

### 2. Environment Configuration
Create `.env` inside `backend/`:
```env
PORT=5080
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/opspilot"
OPENAI_API_KEY="your-openai-api-key"
```

### 3. Running the Application
```bash
# Start backend (5080) and frontend (3000) simultaneously
./start.sh
```

Access the Web Dashboard at **`http://localhost:3000`**.

### 4. Stopping the Application
```bash
# Cleanly terminate all running dev processes
./stop.sh
```

---

## 📡 REST API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `GET /api/health` | `GET` | Health check endpoint returning backend status |
| `GET /api/projects` | `GET` | Fetch all configured workspace projects |
| `POST /api/projects` | `POST` | Create or update a project workspace |
| `GET /api/projects/:id/deploy-gap` | `GET` | Compare GitHub commit vs Production server commit |
| `POST /api/projects/ai-deploy` | `POST` | Trigger autonomous AI deployment pipeline |
| `POST /api/incidents` | `POST` | Create and trigger an AI incident investigation loop |
| `GET /api/incidents/:id` | `GET` | Fetch incident diagnostic state and evidence |
| `GET /api/incidents/:id/stream` | `GET` | Real-time Server-Sent Events (SSE) log stream |
| `POST /api/approvals/:id/approve` | `POST` | Operator approval to execute recovery patch |
| `POST /api/repositories/scan` | `POST` | Trigger repository AST security & vulnerability audit |

---

## 🛡️ Security & Guardrail Model

D-OpsPilot AI strictly blocks destructive terminal commands at both the API and SSH execution layers:
- ❌ `rm -rf /` or `rm -r /`
- ❌ `mkfs` or `dd if=`
- ❌ `:(){ :|:& };:` (Fork bombs)
- ❌ `shutdown`, `reboot`, or `poweroff`

All execution attempts targeting these patterns are intercepted by the **Security Shield Engine** and logged to audit records.

---

## 📄 License & Attribution

Developed with ❤️ by **Chandan Vishwakarma (WildDragon)**. Licensed under MIT.
