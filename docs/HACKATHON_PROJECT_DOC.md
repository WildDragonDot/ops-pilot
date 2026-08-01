# D-OpsPilot AI (DOP) — Hackathon Project Documentation
**ChatGPT Codex India Hackathon 2026 Submission Document**

---

## 📌 1. Submission Overview

| Information Field | Details |
| :--- | :--- |
| **Project Name** | **D-OpsPilot AI (DOP)** |
| **Track / Theme** | **Theme 1: Agentic Coding** *(Secondary: Theme 2: UX for Agentic Applications)* |
| **Tagline** | **Autonomous SRE & AI Incident Commander with WebCrypto Zero-DB Security Vault** |
| **Live Deployed App URL** | [https://dopspilot.chandandev.online](https://dopspilot.chandandev.online) |
| **GitHub Repository URL** | [https://github.com/WildDragonDot/ops-pilot](https://github.com/WildDragonDot/ops-pilot) |
| **Target Server Host** | AWS EC2 Ubuntu 26.04 (`dopspilot.chandandev.online`) |
| **Team Lead / Author** | Chandan Vishwakarma (WildDragon) |

---

## 💡 2. Executive Summary & Problem Statement

### **The Problem**:
In modern cloud infrastructure, microservice outages (e.g. 502 Bad Gateway, database connection limit exhaustion, unhandled handler panics, container memory leaks) cause catastrophic downtime and financial loss. Site Reliability Engineers (SREs) and software developers waste hours manually SSHing into servers, parsing tens of thousands of raw container log lines, manually executing diagnostic bash commands, and hunting down which git commit introduced the outage.

Furthermore, traditional AI tools require users to upload server SSH private keys or cloud credentials to remote backend databases, creating severe security vulnerabilities and compliance risks.

### **The Solution — D-OpsPilot AI**:
**D-OpsPilot AI** is an enterprise-grade, evidence-driven autonomous DevOps & SRE AI Agent. Powered by OpenAI Codex and Google Gemini with local heuristic failover, D-OpsPilot AI:
- Autonomously investigates production server outages and container crashes.
- Parses raw SSE container streams and correlates recent git commits with failures.
- Executes 1-Click zero-downtime deployments with automated HTTP 200 health check verification.
- Audits GitHub repositories for AST code vulnerabilities, hardcoded secrets, and unvalidated parameters.
- Guarantees **Zero-Knowledge Privacy** by storing 0 SSH keys or tokens on the server — all credentials remain encrypted locally in the user's browser using AES-256 WebCrypto.

---

## 📽️ 3. System Architecture & Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          👨‍💻 SRE / DEVELOPER DASHBOARD                        │
│                   React 18 + Vite + TailwindCSS + WebCrypto                 │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (AES-256 Browser WebCrypto Vault)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      🚀 NODE.JS + EXPRESS BACKEND ENGINE                     │
│                Prisma ORM | JWT Auth | Child Process Shield                 │
└──────────┬───────────────────────────┬───────────────────────────┬──────────┘
           │                           │                           │
           ▼                           ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  AI INTELLIGENCE    │     │  SECURITY SHIELD    │     │   PRODUCTION HOST   │
│  OpenAI GPT-4o      │     │  Forbidden Command  │     │   AWS Ubuntu 26.04  │
│  Gemini 3.6 Flash   │     │  Interceptor Filter │     │   Docker Compose    │
│  Local Heuristics   │     │  (`rm -rf /` block) │     │   Postgres & Redis  │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

---

## 🤖 4. Agentic AI Capabilities (OpenAI Codex & Multi-Model Intelligence)

D-OpsPilot AI goes far beyond basic autocomplete, demonstrating multi-step agentic reasoning, planning, tool calling, and self-review loops:

1. **Autonomous Incident Investigation Loop**:
   - **Step 1: Evidence Gathering**: Reads raw container logs, container metrics (`docker stats`), and system resource usage.
   - **Step 2: Root-Cause Diagnosis**: Evaluates system state against known failure patterns (e.g., PostgreSQL connection pool exhaustion).
   - **Step 3: Remediation Plan Generation**: Generates targeted recovery bash commands and code patches.
   - **Step 4: Self-Review & Risk Assessment**: Assigns a confidence score and risk level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).

2. **Commit-to-Deployment Gap Analysis**:
   - Compares the SHA hash of the latest GitHub `main` commit against the running commit hash on the live production server.
   - Automates full pipeline (`git pull origin main && npm run build && docker compose restart`) with post-deployment health check pings.

3. **Natural Language Web SSH Command Copilot**:
   - Translates English and Hindi queries (e.g. *"check error log in docker"*, *"mera server setup kya h"*) into verified, safe bash commands.
   - Features built-in VT100 / ANSI escape sequence stripping for clean table rendering (`htop`, `top`, `docker ps`).

4. **AST Code Security Auditor**:
   - Audits source code AST trees for hardcoded secrets, plain-text API keys, vulnerable dependencies (CVE scanner), and missing parameter validation.

---

## 🌟 5. Complete Feature Modules

| Feature Module | Description & Capability |
| :--- | :--- |
| 🤖 **Autonomous Incident Commander** | AI outage diagnosis for 502 Bad Gateway, PostgreSQL limits, memory leaks, and Nginx errors. |
| 📦 **1-Click AI Deployment Pipeline** | Live commit gap detector, automated docker rebuild, container restart, and HTTP 200 OK verification. |
| 💻 **Interactive Remote SSH Web Terminal** | Real-time browser SSH shell with ANSI stripper, AI Copilot drawer, and preset quick-action buttons. |
| 🔒 **WebCrypto Zero-DB Security Vault** | AES-256 browser encryption. **Zero SSH keys, passwords, or tokens are ever stored in backend DB.** |
| 🛡️ **Tech-Stack Dynamic Chaos Engine** | Simulates live production failure scenarios (database connection limits, panics, memory bottlenecks) tailored to your microservices stack. |
| 🕵️ **GitHub AST Code & Security Auditor** | Scans source files and commit logs for leaked secrets, vulnerable dependencies, and unsanitized parameters. |
| ⏸️ **Human-in-the-Loop Safety Approvals** | Operator approval gate before executing write actions or server patches with unified git diff previews. |
| 📊 **Real-Time SSE Streams & Topology Graph** | Live Server-Sent Events log stream and interactive visual SVG graph of container nodes, ports, and health status. |
| 📚 **Automated SRE Runbooks Library** | Pre-built operational procedures for database vacuuming, cache invalidation, and disk cleanup. |
| 📝 **AI Post-Mortem Reports Generator** | Generates structured post-mortem incident reports with root-cause timelines, impact metrics, and preventive recommendations. |

---

## 🛡️ 6. Zero-Knowledge WebCrypto Security Architecture

### **Core Security Principles**:
1. **Zero Database Persistence**:
   - The Prisma database schema contains **0 columns** for SSH keys, server passwords, or GitHub Personal Access Tokens.
   - Credentials remain 100% strictly local in the user's browser WebCrypto storage.
2. **Dynamic Isolated Key Files (`0600` Permissions)**:
   - When an SSH private key is provided for execution, the backend writes a temporary isolated key file with strict `0600` Linux permissions.
   - The temporary file is immediately unlinked (deleted) from disk as soon as the command completes.
3. **Forbidden Bash Command Interceptor**:
   - Both API and SSH layers block destructive operations:
     - ❌ `rm -rf /` or `rm -r /` (Catastrophic file deletion)
     - ❌ `mkfs` or `dd if=` (Disk partition wipe)
     - ❌ `:(){ :|:& };:` (Fork bombs)
     - ❌ `shutdown`, `reboot`, `poweroff` (Server shutdown)

---

## 🛠️ 7. Technical Stack & Dependencies

```
┌─────────────────┬───────────────────────────────────────────────────────────┐
│ Layer           │ Technology / Library                                      │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ Frontend        │ React 18, TypeScript, Vite, TailwindCSS, Framer Motion    │
│ Security Vault  │ WebCrypto API (AES-256-GCM browser encryption)            │
│ Backend Runtime │ Node.js v22, Express, TypeScript                          │
│ Database / ORM  │ Prisma ORM (PostgreSQL / SQLite)                          │
│ AI Models       │ OpenAI GPT-4o Codex, Google Gemini 3.6 Flash / Pro         │
│ Remote Tunnel   │ SSH2 Client, Server-Sent Events (SSE)                     │
│ Target Server   │ AWS EC2 Ubuntu 26.04, Docker Compose, Nginx Reverse Proxy │
└─────────────────┴───────────────────────────────────────────────────────────┘
```

---

## 🏆 8. Alignment with Hackathon Evaluation Matrix

| Evaluation Criteria | Weightage | Demonstrated Implementation |
| :--- | :---: | :--- |
| **Technical Execution** | **50%** | Production-ready architecture, zero-downtime deployment script (`deploy-to-server.sh`), ANSI terminal sanitizer, 100% passing End-to-End Master Test Suite (`npm test`). Deployed live on AWS EC2. |
| **Impact & Problem Fit** | **20%** | Solves real-world SRE downtime and toil by automating root-cause diagnosis, server recovery, and security auditing. |
| **Use of Codex** | **15%** | Deep agentic reasoning loop: planning, log parsing, tool calling, AST patch generation, and self-review. |
| **Creativity & Originality** | **10%** | Novel Zero-DB WebCrypto vault architecture + natural language bilingual (Hindi/English) terminal copilot. |
| **Completeness & Demo Quality** | **5%** | Fully functional web dashboard live at `https://dopspilot.chandandev.online` with 0 login barriers. |

---

## 🎥 9. 3-Minute Demo Video Script & Walkthrough Outline

- **[0:00 - 0:45] Introduction & Dashboard Overview**:
  - Show live deployed application at `https://dopspilot.chandandev.online`.
  - Highlight multi-project header, microservices topology graph, and zero-knowledge security badge.
- **[0:45 - 1:30] Autonomous Incident Commander**:
  - Simulate production outage (e.g. 502 Bad Gateway / PostgreSQL connection limit).
  - Show Codex agentic reasoning stream, live log parsing, and root-cause diagnostic report generation.
- **[1:30 - 2:15] Web SSH Terminal & Copilot**:
  - Open Web SSH Terminal.
  - Ask AI Copilot in natural language (*"check docker error log"*).
  - Show clean ANSI-stripped table output and preset quick action toolbar.
- **[2:15 - 3:00] Deployment Gap & Safety Approvals**:
  - Compare GitHub `main` commit vs running server commit (`deploy-gap`).
  - Demonstrate Human-in-the-Loop Safety Approval queue with unified git diff preview and operator sign-off.

---

## 📄 10. License & Credits

Developed with ❤️ by **Chandan Vishwakarma (WildDragon)** for the **ChatGPT Codex India Hackathon 2026**. Licensed under [MIT License](LICENSE).
