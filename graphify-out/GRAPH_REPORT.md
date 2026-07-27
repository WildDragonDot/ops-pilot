# Graph Report - .  (2026-07-28)

## Corpus Check
- Corpus is ~15,087 words - fits in a single context window. You may not need a graph.

## Summary
- 283 nodes · 477 edges · 16 communities
- Extraction: 99% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 1,250 input · 350 output

## Community Hubs (Navigation)
- Express Backend API Router
- Prisma Database ORM Models
- OpenAI Service & Agent Logic
- React 19 Frontend Components
- Authentication & JWT Management
- GitHub Repo Auditor & Static Scanner
- Incident Controller & SSE Streaming
- Docker Compose Cluster Environment
- System Topology & Infrastructure Map
- Incident Reports & Post-Mortem Exporter
- Sandbox Failure Injector
- Command Palette Quick Launcher
- Navigation & Layout Shell

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 18 edges
2. `Incident` - 15 edges
3. `useAuth()` - 13 edges
4. `Project` - 13 edges
5. `getAuthHeaders()` - 12 edges
6. `getIncidentById()` - 9 edges
7. `compilerOptions` - 9 edges
8. `AppRoutes()` - 9 edges
9. `Scan` - 9 edges
10. `scripts` - 7 edges

## Surprising Connections (you probably didn't know these)
- `NavbarProps` --references--> `Project`  [EXTRACTED]
  frontend/src/components/Navbar.tsx → frontend/src/types/index.ts
- `RepoAuditorProps` --references--> `Scan`  [EXTRACTED]
  frontend/src/pages/RepoAuditor.tsx → frontend/src/types/index.ts
- `Frontend HTML Entrypoint` --MOUNTS--> `OpsPilot AI Overview`  [0.9]
  frontend/index.html → README.md
- `OpsPilot AI Overview` --DESCRIBES--> `System Architecture Spec`  [0.95]
  README.md → docs/architecture.md
- `System Architecture Spec` --DEPLOYS_VIA--> `Docker Compose Cluster Topology`  [0.95]
  docs/architecture.md → docker-compose.yml

## Import Cycles
- None detected.

## Communities (16 total, 0 thin omitted)

### Community 0 - "Express Backend API Router"
Cohesion: 0.10
Nodes (37): approveFix(), rejectFix(), getMe(), login(), register(), createIncident(), getIncident(), getIncidents() (+29 more)

### Community 1 - "Prisma Database ORM Models"
Cohesion: 0.10
Nodes (26): CommandPalette(), CommandPaletteProps, Header(), HeaderProps, Sidebar(), SidebarProps, TerminalConsole(), TerminalConsoleProps (+18 more)

### Community 2 - "OpenAI Service & Agent Logic"
Cohesion: 0.07
Nodes (28): dependencies, bcryptjs, cors, dotenv, express, jsonwebtoken, openai, @prisma/client (+20 more)

### Community 3 - "React 19 Frontend Components"
Cohesion: 0.22
Nodes (19): DiffViewer(), DiffViewerProps, ApprovalsPage(), CommandCenter(), RepoAuditor(), RepoAuditorProps, AppRoutes(), approveFix() (+11 more)

### Community 4 - "Authentication & JWT Management"
Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+15 more)

### Community 5 - "GitHub Repo Auditor & Static Scanner"
Cohesion: 0.15
Nodes (13): App(), Navbar(), NavbarProps, AuthContext, AuthContextType, AuthProvider(), useAuth(), User (+5 more)

### Community 6 - "Incident Controller & SSE Streaming"
Cohesion: 0.11
Nodes (19): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/react, @types/react-dom (+11 more)

### Community 7 - "Docker Compose Cluster Environment"
Cohesion: 0.11
Nodes (18): dependencies, lucide-react, react, react-dom, react-router-dom, description, name, private (+10 more)

### Community 8 - "System Topology & Infrastructure Map"
Cohesion: 0.12
Nodes (17): devDependencies, prisma, tsx, @types/bcryptjs, @types/cors, @types/express, @types/jsonwebtoken, @types/node (+9 more)

### Community 9 - "Incident Reports & Post-Mortem Exporter"
Cohesion: 0.13
Nodes (14): description, engines, node, name, private, scripts, build:backend, build:frontend (+6 more)

### Community 10 - "Sandbox Failure Injector"
Cohesion: 0.29
Nodes (9): hasOpenAIKey(), getRepository(), getScanById(), triggerScan(), auditCodebaseWithOpenAI(), CodeFileContext, runOpenAIIncidentReasoning(), executeRepoScan() (+1 more)

### Community 11 - "Command Palette Quick Launcher"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, module, moduleResolution, outDir, rootDir, skipLibCheck, strict (+3 more)

### Community 12 - "Navigation & Layout Shell"
Cohesion: 0.50
Nodes (4): Docker Compose Cluster Topology, Frontend HTML Entrypoint, OpsPilot AI Overview, System Architecture Spec

## Knowledge Gaps
- **106 isolated node(s):** `name`, `version`, `private`, `description`, `type` (+101 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `System Topology & Infrastructure Map` to `OpenAI Service & Agent Logic`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Incident Controller & SSE Streaming` to `Docker Compose Cluster Environment`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _106 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Express Backend API Router` be split into smaller, more focused modules?**
  _Cohesion score 0.09898242368177614 - nodes in this community are weakly interconnected._
- **Should `Prisma Database ORM Models` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `OpenAI Service & Agent Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `Authentication & JWT Management` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._