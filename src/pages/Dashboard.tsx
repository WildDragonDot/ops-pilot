import React from 'react';
import { 
  ShieldCheck, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Server, 
  Database, 
  Layers, 
  ArrowRight,
  Terminal,
  Zap,
  GitPullRequest,
  Cpu
} from 'lucide-react';
import { Project, Scan, Incident } from '../types';

interface DashboardProps {
  project: Project | null;
  scan: Scan | null;
  incidents: Incident[];
  onNavigateTab: (tab: string) => void;
  onInjectFailure: (scenarioKey: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  project,
  scan,
  incidents,
  onNavigateTab,
  onInjectFailure
}) => {
  const env = project?.environmentStatus || {
    overall: 'HEALTHY',
    postgres: 'RUNNING',
    redis: 'RUNNING',
    api: 'RUNNING',
    nginx: 'HEALTHY'
  };

  const score = scan?.overallScore || 78;
  const criticalFindings = scan?.findings.filter(f => f.severity === 'CRITICAL').length || 2;
  const pendingApprovals = incidents.filter(i => i.status === 'AWAITING_APPROVAL').length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner Hero */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>Evidence-Driven Autonomous AI Agent</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Production Failure Commander & GitHub Intelligence
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              OpsPilot AI inspects your GitHub repository for security & code risks, investigates live production outages, correlates commit diffs, proposes safe fixes, and waits for human approval before execution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('command')}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition"
            >
              <Terminal className="w-4 h-4" />
              <span>Launch Incident Commander</span>
            </button>
            <button
              onClick={() => onNavigateTab('auditor')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
            >
              <span>Inspect Repository</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Repo Health Score Card */}
        <div className="glass-panel glass-panel-hover p-5 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Repo Health Score</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{score}</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${score}%` }} />
          </div>
          <p className="text-[11px] text-slate-400">Security 72% | Quality 80% | Testing 65%</p>
        </div>

        {/* Service Health Card */}
        <div className="glass-panel glass-panel-hover p-5 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Production Status</span>
            <Activity className={`w-5 h-5 ${env.overall === 'HEALTHY' ? 'text-emerald-400' : 'text-rose-400'}`} />
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-extrabold ${env.overall === 'HEALTHY' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {env.overall}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
            <span className="text-slate-400">PostgreSQL: <b className={env.postgres === 'RUNNING' ? 'text-emerald-400' : 'text-rose-400'}>{env.postgres}</b></span>
            <span className="text-slate-400">Node API: <b className={env.api === 'RUNNING' ? 'text-emerald-400' : 'text-rose-400'}>{env.api}</b></span>
          </div>
        </div>

        {/* Critical Findings */}
        <div className="glass-panel glass-panel-hover p-5 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Critical Code Risks</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">{criticalFindings}</span>
            <span className="text-xs text-slate-400">Issues</span>
          </div>
          <p className="text-[11px] text-slate-400">Hardcoded JWT secret & unhandled string ID parameter</p>
        </div>

        {/* Pending Approvals */}
        <div className="glass-panel glass-panel-hover p-5 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Approvals</span>
            <CheckCircle2 className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-400">{pendingApprovals}</span>
            <span className="text-xs text-slate-400">Fix Requests</span>
          </div>
          <p className="text-[11px] text-slate-400">Safety guardrails require explicit operator approval</p>
        </div>

      </div>

      {/* Middle Grid: Topology Map & Live Failure Injector Lab */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* System Topology Map */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Production Topology & Health Inspector</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">Runtime: Docker Compose</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 py-4">
            
            {/* Nginx Card */}
            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center space-y-2 ${
              env.nginx === 'HEALTHY' ? 'bg-slate-900/60 border-slate-800' : 'bg-rose-950/40 border-rose-800'
            }`}>
              <Server className="w-6 h-6 text-blue-400" />
              <span className="text-xs font-bold">Nginx Proxy</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                env.nginx === 'HEALTHY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>{env.nginx}</span>
            </div>

            {/* Node API Card */}
            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center space-y-2 ${
              env.api === 'RUNNING' ? 'bg-slate-900/60 border-slate-800' : 'bg-rose-950/40 border-rose-800'
            }`}>
              <Cpu className="w-6 h-6 text-purple-400" />
              <span className="text-xs font-bold">Node.js API</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                env.api === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>{env.api}</span>
            </div>

            {/* Postgres Card */}
            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center space-y-2 ${
              env.postgres === 'RUNNING' ? 'bg-slate-900/60 border-slate-800' : 'bg-rose-950/40 border-rose-800'
            }`}>
              <Database className="w-6 h-6 text-indigo-400" />
              <span className="text-xs font-bold">PostgreSQL</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                env.postgres === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>{env.postgres}</span>
            </div>

            {/* Redis Card */}
            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center space-y-2 ${
              env.redis === 'RUNNING' ? 'bg-slate-900/60 border-slate-800' : 'bg-rose-950/40 border-rose-800'
            }`}>
              <Activity className="w-6 h-6 text-amber-400" />
              <span className="text-xs font-bold">Redis Cache</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                env.redis === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>{env.redis}</span>
            </div>

          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Repository: <code className="text-blue-400 font-mono">company/production-backend-api</code></span>
            <span>Health Endpoint: <code className="text-slate-300 font-mono">http://localhost:8080/health</code></span>
          </div>
        </div>

        {/* Live Scenario Injector Demo Card */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Simulate Incident Scenarios</span>
            </h2>
            <p className="text-xs text-slate-400">
              Inject real-world production failures to test OpsPilot AI's automated investigation, evidence correlation, and recovery.
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                onInjectFailure('DATABASE_STOPPED');
                onNavigateTab('command');
              }}
              className="w-full text-left p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs flex items-center justify-between group transition"
            >
              <div>
                <span className="font-semibold text-rose-400 block">Scenario 1: 502 Bad Gateway</span>
                <span className="text-[11px] text-slate-400">PostgreSQL container down & API crash</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => {
                onInjectFailure('CONFIG_MISMATCH');
                onNavigateTab('command');
              }}
              className="w-full text-left p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs flex items-center justify-between group transition"
            >
              <div>
                <span className="font-semibold text-amber-400 block">Scenario 2: Config Mismatch</span>
                <span className="text-[11px] text-slate-400">DATABASE_URL host name misconfigured</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => {
                onInjectFailure('CODE_BUG');
                onNavigateTab('command');
              }}
              className="w-full text-left p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs flex items-center justify-between group transition"
            >
              <div>
                <span className="font-semibold text-blue-400 block">Scenario 3: Code Bug (500 Error)</span>
                <span className="text-[11px] text-slate-400">String passed to Integer Prisma query</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
