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
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b theme-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 text-xs font-semibold">
              Live Operations Control
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-title mt-1">Production Overview</h1>
          <p className="text-xs text-subtitle mt-1">
            Real-time cluster status, security audit scores, and autonomous AI incident commander.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('command')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg glow-blue transition"
          >
            <Terminal className="w-4 h-4" />
            <span>Investigate Outage</span>
          </button>
          <button
            onClick={() => onNavigateTab('auditor')}
            className="flex items-center gap-2 px-4 py-2.5 card-bg-subtle hover:text-title text-subtitle text-xs font-bold rounded-xl border theme-border transition"
          >
            <span>Scan Codebase</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metric Glass Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-subtitle">
            <span className="text-xs font-bold uppercase tracking-wider">Overall Health</span>
            <Activity className={`w-5 h-5 ${env.overall === 'HEALTHY' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold ${env.overall === 'HEALTHY' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {env.overall}
            </span>
          </div>
          <p className="text-[11px] text-subtitle font-mono">Nginx • Node API • PostgreSQL • Redis</p>
        </div>

        <div className="glass-panel glass-panel-hover p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-subtitle">
            <span className="text-xs font-bold uppercase tracking-wider">Audit Score</span>
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-title">{score}</span>
            <span className="text-xs text-subtitle">/ 100</span>
          </div>
          <div className="w-full card-bg-subtle h-2 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" style={{ width: `${score}%` }} />
          </div>
          <p className="text-[11px] text-subtitle font-mono">Security 72% | Quality 80% | Testing 65%</p>
        </div>

        <div className="glass-panel glass-panel-hover p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-subtitle">
            <span className="text-xs font-bold uppercase tracking-wider">Critical Code Risks</span>
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{criticalFindings}</span>
            <span className="text-xs text-subtitle">Issues</span>
          </div>
          <p className="text-[11px] text-subtitle font-mono">Hardcoded JWT key & string ID parameter</p>
        </div>

        <div className="glass-panel glass-panel-hover p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-subtitle">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Approvals</span>
            <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{pendingApprovals}</span>
            <span className="text-xs text-subtitle">Requests</span>
          </div>
          <p className="text-[11px] text-subtitle font-mono">Operator approval guardrails active</p>
        </div>

      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Glass Topology Map */}
        <div className="lg:col-span-2">
          <TopologyGraph environmentStatus={env} />
        </div>

        {/* Right Column: Outage Scenario Launchers */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-title flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Simulate Incident Scenarios</span>
            </h2>
            <p className="text-xs text-subtitle mt-1">
              Test OpsPilot AI's automated reasoning, tool execution, and recovery approval loop.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                onInjectFailure('DATABASE_STOPPED');
                onNavigateTab('command');
              }}
              className="w-full text-left p-3.5 rounded-xl card-bg-subtle border theme-border hover:border-slate-400 dark:hover:border-slate-700 text-xs flex items-center justify-between group transition-all"
            >
              <div>
                <span className="font-extrabold text-rose-500 block">1. 502 Bad Gateway Outage</span>
                <span className="text-[11px] text-subtitle">PostgreSQL container down & API crash</span>
              </div>
              <ArrowRight className="w-4 h-4 text-subtitle group-hover:text-title group-hover:translate-x-1 transition" />
            </button>

            <button
              onClick={() => {
                onInjectFailure('CONFIG_MISMATCH');
                onNavigateTab('command');
              }}
              className="w-full text-left p-3.5 rounded-xl card-bg-subtle border theme-border hover:border-slate-400 dark:hover:border-slate-700 text-xs flex items-center justify-between group transition-all"
            >
              <div>
                <span className="font-extrabold text-amber-500 block">2. Config Host Mismatch</span>
                <span className="text-[11px] text-subtitle">DATABASE_URL host name misconfigured</span>
              </div>
              <ArrowRight className="w-4 h-4 text-subtitle group-hover:text-title group-hover:translate-x-1 transition" />
            </button>

            <button
              onClick={() => {
                onInjectFailure('CODE_BUG');
                onNavigateTab('command');
              }}
              className="w-full text-left p-3.5 rounded-xl card-bg-subtle border theme-border hover:border-slate-400 dark:hover:border-slate-700 text-xs flex items-center justify-between group transition-all"
            >
              <div>
                <span className="font-extrabold text-blue-500 block">3. Login API 500 Code Bug</span>
                <span className="text-[11px] text-subtitle">String passed to Integer Prisma query</span>
              </div>
              <ArrowRight className="w-4 h-4 text-subtitle group-hover:text-title group-hover:translate-x-1 transition" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
