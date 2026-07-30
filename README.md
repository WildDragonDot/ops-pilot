# D-OpsPilot AI (DOP) 🚀

> **Autonomous Incident Commander & Zero-DB Security Architecture**

D-OpsPilot AI is an evidence-driven engineering agent for production incidents, real-time microservices management, and GitHub repository intelligence. It inspects live container logs, traces root cause failures across health checks, correlates recent commits with outages, and executes recovery actions with human-in-the-loop safety guardrails.

---

## 🌟 Key Capabilities & Features

- **🚀 Autonomous AI Deployment & Health Verification**: Detects deployment gaps between GitHub commits and production servers (`34.224.80.31`), auto-triggers zero-downtime builds (`git pull && npm run build`), and verifies HTTP 200 health.
- **🛡️ Dynamic Tech-Stack Chaos Engine**: AI-suggested outage simulation scenarios tailored specifically to your active stack (Node.js, Go/nanomdm, PostgreSQL 15, Redis 7, Docker).
- **🔒 Zero-DB Client Security Vault**: Client-side AES-256 WebCrypto encrypted credentials vault ensuring server SSH keys and GitHub PAT tokens NEVER touch the backend database.
- **📁 Multi-Project Header Navigation**: Target remote server directory dropdown in top global header (`/home/ubuntu/finance-lock`, `/var/www/my-app`, etc.) with local path sanitization.
- **🤖 Dedicated AI Security Auditor**: Scans repositories for leaked credentials, hardcoded API keys, JWT secret fallbacks, and dependency vulnerabilities (CVEs).
- **⏸️ Human-in-the-Loop Approval Queue**: Requires explicit operator sign-off before executing write actions, service restarts, database updates, or code patches.
- **🛑 Clean Terminal Control (`./stop.sh`)**: One-command silent process termination for frontend and backend watcher instances.

---

## 🏗️ Architecture & Stack

- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, Lucide Icons, Framer Motion
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL / TimescaleDB, SSH2
- **AI Agent**: OpenAI GPT-4o Codex / Tool Calling Engine & High-Precision Fallback Analyzer
- **Target Remote Host**: Ubuntu 22.04 LTS (`34.224.80.31`) running Finance-Lock Microservices (PostgreSQL 15, Redis 7, MicroMDM NanoMDM, NanoDEP, Nginx)

---

## 🛠️ Quick Start & Local Setup

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/WildDragonDot/ops-pilot.git
cd ops-pilot

# Install root & workspace dependencies
npm install
```

### 2. Configure Environment
Create `.env` inside `backend/`:
```env
PORT=5080
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/opspilot"
OPENAI_API_KEY="your-openai-api-key"
```

### 3. Start Development Servers
```bash
# Start backend (5080) and frontend (3000)
./start.sh
```

### 4. Clean Shutdown
```bash
# Terminate processes cleanly
./stop.sh
```

---

## 🔒 Safety & Guardrail Policy

D-OpsPilot AI strictly blocks high-risk destructive commands (e.g. `rm -rf /`, `mkfs`, `:(){ :|:& };:`, `shutdown`, `reboot`) at both client and server SSH layers. Operator sign-off is mandatory for all state-changing commands.

---

## 📄 License & Attribution

Developed with ❤️ by **DeepMind / AI for Bharat SRE Team**. Licensed under MIT.
