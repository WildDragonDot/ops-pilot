import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Terminal,
  Zap,
  Clock,
  Radio,
  FileCode,
  Sliders,
  Play
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

  const score = scan?.overallScore || 84;
  const criticalFindings = scan?.findings.filter(f => f.severity === 'CRITICAL').length || 2;
  const pendingApprovals = incidents.filter(i => i.status === 'AWAITING_APPROVAL').length;

  const recentEvents = [
    {
      id: 'evt-1',
      time: '10 mins ago',
      title: 'Resolved Login API 500 Code Bug',
      type: 'CODE_PATCH',
      status: 'SUCCESS',
      detail: 'Applied req.params.id integer validation patch in auth.controller.ts'
    },
    {
      id: 'evt-2',
      time: '45 mins ago',
      title: 'Completed GitHub Security Audit',
      type: 'SCAN',
      status: 'SUCCESS',
      detail: 'Audited 2,025 modules across company/production-backend-api'
    },
    {
      id: 'evt-3',
      time: '2 hours ago',
      title: 'PostgreSQL Container Health Restored',
      type: 'RECOVERY',
      status: 'SUCCESS',
      detail: 'Restarted postgres container & verified 200 OK health check'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto font-sans pb-12"
    >
      
      {/* Top Welcome Header */}
      <div className="glass-panel p-6 rounded-2xl theme-border border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-semibold font-mono">
              Live Operations Control
            </span>
          </div>
          <h1 className="text-2xl font-bold text-title tracking-tight">Production Overview</h1>
          <p className="text-xs text-subtitle max-w-2xl leading-relaxed">
            Real-time cluster topology status, security audit health metrics, and autonomous AI incident commander.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigateTab('command')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Terminal className="w-4 h-4" />
            <span>Investigate Outage</span>
          </button>
          <button
            onClick={() => onNavigateTab('auditor')}
            className="flex items-center gap-2 px-4 py-2 card-bg-subtle hover:text-title text-subtitle text-xs font-semibold rounded-xl border theme-border transition"
          >
            <span>Scan Codebase</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metric Glass Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Overall Cluster Health */}
        <div className="glass-panel p-5 rounded-2xl theme-border border space-y-3 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-750 dark:text-slate-250">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-650 dark:text-slate-350 font-mono">Overall Health</span>
            <Activity className={`w-5 h-5 ${env.overall === 'HEALTHY' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold ${env.overall === 'HEALTHY' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
              {env.overall}
            </span>
          </div>
          <div className="pt-2 border-t theme-border flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-mono">
            <span>Uptime: <b className="text-slate-800 dark:text-slate-200">99.98%</b></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">4/4 Nodes</span>
          </div>
        </div>

        {/* Card 2: Security & Quality Score */}
        <div className="glass-panel p-5 rounded-2xl theme-border border space-y-3 shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => onNavigateTab('auditor')}>
          <div className="flex items-center justify-between text-slate-750 dark:text-slate-250">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-655 dark:text-slate-345 font-mono">Audit Score</span>
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-title">{score}</span>
            <span className="text-xs text-slate-500 font-bold">/ 100</span>
          </div>
          <div className="w-full card-bg-subtle h-2 rounded-full overflow-hidden border theme-border">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${score}%` }} />
          </div>
          <p className="text-[11px] text-slate-650 dark:text-slate-350 font-mono truncate">Security 72% | Quality 88% | Testing 65%</p>
        </div>

        {/* Card 3: Critical Code Risks */}
        <div className="glass-panel p-5 rounded-2xl theme-border border space-y-3 shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => onNavigateTab('auditor')}>
          <div className="flex items-center justify-between text-slate-750 dark:text-slate-250">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-655 dark:text-slate-345 font-mono">Critical Code Risks</span>
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{criticalFindings}</span>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Issues Detected</span>
          </div>
          <p className="text-[11px] text-slate-650 dark:text-slate-350 font-mono truncate">Hardcoded JWT key & string ID query</p>
        </div>

        {/* Card 4: Pending Approvals */}
        <div className="glass-panel p-5 rounded-2xl theme-border border space-y-3 shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => onNavigateTab('approvals')}>
          <div className="flex items-center justify-between text-slate-750 dark:text-slate-250">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-655 dark:text-slate-345 font-mono">Pending Approvals</span>
            <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{pendingApprovals}</span>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Requests</span>
          </div>
          <p className="text-[11px] text-slate-650 dark:text-slate-350 font-mono truncate">Operator safety guardrails active</p>
        </div>

      </div>

      {/* Main 2-Column Section: Topology Map + Incident Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Interactive Topology Graph */}
        <div className="lg:col-span-2">
          <TopologyGraph environmentStatus={env} />
        </div>

        {/* Right Column: Chaos Outage Scenario Launchers */}
        <div className="glass-panel p-6 rounded-2xl theme-border border space-y-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-semibold font-mono">
                Chaos Testing Engine
              </span>
            </div>
            <h2 className="text-lg font-bold text-title tracking-tight mt-1 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Simulate Incident Scenarios</span>
            </h2>
            <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed mt-0.5">
              Test OpsPilot AI's automated reasoning, tool execution, and recovery approval loop.
            </p>
          </div>

          <div className="space-y-3">
            {/* Scenario 1 */}
            <button
              onClick={() => {
                onInjectFailure('DATABASE_STOPPED');
                onNavigateTab('command');
              }}
              className="w-full text-left p-3.5 rounded-xl glass-panel border border-l-4 border-l-rose-500 theme-border hover:border-rose-500 hover:shadow-md text-xs flex items-center justify-between group transition-all"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-extrabold status-danger uppercase">Critical</span>
                  <span className="font-extrabold text-title">1. 502 Bad Gateway Outage</span>
                </div>
                <span className="text-[11px] text-subtitle block">PostgreSQL container down & API crash</span>
              </div>
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition shrink-0">
                <Play className="w-3.5 h-3.5 fill-current" />
              </div>
            </button>

            {/* Scenario 2 */}
            <button
              onClick={() => {
                onInjectFailure('CONFIG_MISMATCH');
                onNavigateTab('command');
              }}
              className="w-full text-left p-3.5 rounded-xl glass-panel border border-l-4 border-l-amber-500 theme-border hover:border-amber-500 hover:shadow-md text-xs flex items-center justify-between group transition-all"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-extrabold status-warning uppercase">High</span>
                  <span className="font-extrabold text-title">2. Config Host Mismatch</span>
                </div>
                <span className="text-[11px] text-subtitle block">DATABASE_URL host name misconfigured</span>
              </div>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition shrink-0">
                <Play className="w-3.5 h-3.5 fill-current" />
              </div>
            </button>

            {/* Scenario 3 */}
            <button
              onClick={() => {
                onInjectFailure('CODE_BUG');
                onNavigateTab('command');
              }}
              className="w-full text-left p-3.5 rounded-xl glass-panel border border-l-4 border-l-blue-500 theme-border hover:border-blue-500 hover:shadow-md text-xs flex items-center justify-between group transition-all"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-extrabold status-healthy uppercase">Code Bug</span>
                  <span className="font-extrabold text-title">3. Login API 500 Code Bug</span>
                </div>
                <span className="text-[11px] text-subtitle block">String passed to Integer Prisma query</span>
              </div>
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition shrink-0">
                <Play className="w-3.5 h-3.5 fill-current" />
              </div>
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Section: Recent Operations Stream */}
      <div className="glass-panel p-6 rounded-2xl theme-border border space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b theme-border pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-bold text-title">Recent Operational Activity & Automated Audit</h2>
          </div>
          <button
            onClick={() => onNavigateTab('audit-logs')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>View Full Audit Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {recentEvents.map(evt => (
            <div key={evt.id} className="p-3 rounded-xl card-bg-subtle border theme-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-title block">{evt.title}</span>
                  <span className="text-[11px] text-subtitle">{evt.detail}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-[10px] font-mono">
                <span className="text-subtitle">{evt.time}</span>
                <span className="px-2 py-0.5 rounded status-healthy font-extrabold">{evt.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </motion.div>
  );
};
