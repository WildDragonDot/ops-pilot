import React from 'react';
import { 
  ShieldCheck, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Terminal,
  Zap
} from 'lucide-react';
import { Project, Scan, Incident } from '../types';
import { TopologyGraph } from '../components/TopologyGraph';

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
      
      {/* Top Welcome Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Production Overview</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time infrastructure health, codebase security score, and incident investigation launcher.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('command')}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Investigate Outage</span>
          </button>
          <button
            onClick={() => onNavigateTab('auditor')}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg border border-slate-800 transition"
          >
            <span>Scan Codebase</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metric Cards Row (4 Spacious Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Overall Cluster Health</span>
            <Activity className={`w-4 h-4 ${env.overall === 'HEALTHY' ? 'text-emerald-400' : 'text-rose-400'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${env.overall === 'HEALTHY' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {env.overall}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Nginx, Node API, PostgreSQL, Redis</p>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Security & Quality Score</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-100">{score}</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-400">Security 72% • Quality 80% • Testing 65%</p>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Critical Code Issues</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">{criticalFindings}</span>
            <span className="text-xs text-slate-400">Findings</span>
          </div>
          <p className="text-[11px] text-slate-400">Hardcoded JWT key & string ID query</p>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Pending Approvals</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-400">{pendingApprovals}</span>
            <span className="text-xs text-slate-400">Fix Requests</span>
          </div>
          <p className="text-[11px] text-slate-400">Operator approval guardrails active</p>
        </div>

      </div>

      {/* Main 2-Column Section: Topology + Outage Launcher */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Topology Map */}
        <div className="lg:col-span-2">
          <TopologyGraph environmentStatus={env} />
        </div>

        {/* Right Column: Outage Investigation Scenarios */}
        <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Simulate Incident Outages</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select an outage scenario to test OpsPilot AI's automated reasoning, tool execution, and approval workflow.
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => {
                onInjectFailure('DATABASE_STOPPED');
                onNavigateTab('command');
              }}
              className="w-full text-left p-3 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs flex items-center justify-between group transition"
            >
              <div>
                <span className="font-semibold text-rose-400 block">1. 502 Bad Gateway Outage</span>
                <span className="text-[11px] text-slate-400">PostgreSQL container down & API crash</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition" />
            </button>

            <button
              onClick={() => {
                onInjectFailure('CONFIG_MISMATCH');
                onNavigateTab('command');
              }}
              className="w-full text-left p-3 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs flex items-center justify-between group transition"
            >
              <div>
                <span className="font-semibold text-amber-400 block">2. Config Host Mismatch</span>
                <span className="text-[11px] text-slate-400">DATABASE_URL host name misconfigured</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition" />
            </button>

            <button
              onClick={() => {
                onInjectFailure('CODE_BUG');
                onNavigateTab('command');
              }}
              className="w-full text-left p-3 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs flex items-center justify-between group transition"
            >
              <div>
                <span className="font-semibold text-blue-400 block">3. Login API 500 Code Bug</span>
                <span className="text-[11px] text-slate-400">String passed to Integer Prisma query</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
