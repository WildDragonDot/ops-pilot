import React, { useState } from 'react';
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
  Play,
  Loader2,
  Sparkles,
  MessageSquare
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
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);
  const [lastTriggered, setLastTriggered] = useState<string | null>(null);

  const handleLaunchScenario = async (key: string) => {
    try {
      setLoadingScenario(key);
      await onInjectFailure(key);
      setLastTriggered(key);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingScenario(null);
    }
  };

  const rawEnv = project?.environmentStatus || {
    overall: 'HEALTHY',
    postgres: 'RUNNING',
    redis: 'RUNNING',
    api: 'RUNNING',
    nginx: 'HEALTHY'
  };

  const allNodesHealthy = rawEnv.postgres === 'RUNNING' && rawEnv.redis === 'RUNNING' && rawEnv.api === 'RUNNING' && rawEnv.nginx === 'HEALTHY';

  const env = {
    ...rawEnv,
    overall: (allNodesHealthy ? 'HEALTHY' : rawEnv.overall) as 'HEALTHY' | 'DEGRADED' | 'DOWN'
  };

  const score = scan?.overallScore || 84;
  const criticalFindings = scan?.findings.filter(f => f.severity === 'CRITICAL').length || 2;
  const pendingApprovals = incidents.filter(i => i.status === 'AWAITING_APPROVAL').length;

  const recentEvents = [
    {
      id: 'evt-1',
      time: '10 mins ago',
      title: 'Resolved Login API 500 Code Bug',
      detail: 'Applied req.params.id integer validation patch in auth.controller.ts',
      status: 'SUCCESS'
    },
    {
      id: 'evt-2',
      time: '45 mins ago',
      title: 'Completed Security & Code Audit',
      detail: 'Audited modules across repository codebase',
      status: 'CLEAN'
    },
    {
      id: 'evt-3',
      time: '2 hours ago',
      title: 'PostgreSQL Container Health Check',
      detail: 'Verified port 5432 tcp connection & 200 OK state',
      status: 'HEALTHY'
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
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-xs font-bold font-mono">
              Live Operations Control
            </span>
          </div>
          <h1 className="text-2xl font-bold text-title tracking-tight font-display">Production Overview</h1>
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
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-subtitle font-mono">Overall Health</span>
            <Activity className={`w-5 h-5 ${pendingApprovals > 0 ? 'text-amber-500 animate-pulse' : (env.overall === 'HEALTHY' ? 'text-emerald-600' : 'text-rose-600')}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold ${pendingApprovals > 0 ? 'text-amber-500 font-mono' : (env.overall === 'HEALTHY' ? 'text-emerald-600 font-mono' : 'text-rose-600 font-mono')}`}>
              {pendingApprovals > 0 ? 'DEGRADED' : env.overall}
            </span>
          </div>
          <div className="pt-2 border-t theme-border flex items-center justify-between text-[11px] text-subtitle font-mono">
            <span>Uptime: <b className="text-title">99.98%</b></span>
            <span className={pendingApprovals > 0 ? 'text-amber-500 font-bold' : 'text-emerald-600 font-bold'}>
              {pendingApprovals > 0 ? '1 Issue Pending' : '4/4 Nodes'}
            </span>
          </div>
        </div>

        {/* Card 2: Security & Quality Score */}
        <div className="glass-panel p-5 rounded-2xl theme-border border space-y-3 shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => onNavigateTab('auditor')}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-subtitle font-mono">Audit Score</span>
            <ShieldCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-title">{score}</span>
            <span className="text-xs text-subtitle font-bold">/ 100</span>
          </div>
          <div className="w-full card-bg-subtle h-2 rounded-full overflow-hidden border theme-border">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${score}%` }} />
          </div>
          <div className="flex items-center justify-between text-[10px] text-subtitle font-mono pt-0.5">
            <span>Security <b>72%</b></span>
            <span>Quality <b>88%</b></span>
            <span>Testing <b>65%</b></span>
          </div>
        </div>

        {/* Card 3: Critical Code Risks */}
        <div className="glass-panel p-5 rounded-2xl theme-border border space-y-3 shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => onNavigateTab('auditor')}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-subtitle font-mono">Critical Code Risks</span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600">{criticalFindings}</span>
            <span className="text-xs font-bold text-subtitle">Issues Detected</span>
          </div>
          <p className="text-[11px] text-subtitle font-mono truncate">Hardcoded JWT key & string ID query</p>
        </div>

        {/* Card 4: Pending Approvals */}
        <div className="glass-panel p-5 rounded-2xl theme-border border space-y-3 shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => onNavigateTab('approvals')}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-subtitle font-mono">Pending Approvals</span>
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-600">{pendingApprovals}</span>
            <span className="text-xs font-bold text-subtitle">{pendingApprovals === 1 ? 'Pending Request' : 'Pending Requests'}</span>
          </div>
          <p className="text-[11px] text-subtitle font-mono truncate">Operator safety guardrails active</p>
        </div>

      </div>

      {/* Main Grid: Topology & Chaos Scenarios */}
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
            <p className="text-xs text-subtitle leading-relaxed mt-0.5">
              Click a scenario to trigger live failure state in the topology map.
            </p>
          </div>

          <div className="space-y-3">
            {/* Scenario 1 */}
            <button
              disabled={loadingScenario !== null}
              onClick={() => handleLaunchScenario('DATABASE_STOPPED')}
              className={`w-full text-left p-3.5 rounded-xl glass-panel border border-l-4 border-l-rose-500 theme-border text-xs flex items-center justify-between group transition-all ${
                loadingScenario === 'DATABASE_STOPPED'
                  ? 'ring-2 ring-rose-500 opacity-80'
                  : 'hover:border-rose-500 hover:shadow-md'
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                    loadingScenario === 'DATABASE_STOPPED' ? 'bg-rose-500 text-white animate-pulse' : 'status-danger'
                  }`}>
                    {loadingScenario === 'DATABASE_STOPPED' ? 'Injecting...' : 'Critical'}
                  </span>
                  <span className="font-extrabold text-title">1. 502 Bad Gateway Outage</span>
                </div>
                <span className="text-[11px] text-subtitle block">PostgreSQL container down & API crash</span>
              </div>
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition shrink-0">
                {loadingScenario === 'DATABASE_STOPPED' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-rose-600 dark:text-rose-400" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
              </div>
            </button>

            {/* Scenario 2 */}
            <button
              disabled={loadingScenario !== null}
              onClick={() => handleLaunchScenario('CONFIG_MISMATCH')}
              className={`w-full text-left p-3.5 rounded-xl glass-panel border border-l-4 border-l-amber-500 theme-border text-xs flex items-center justify-between group transition-all ${
                loadingScenario === 'CONFIG_MISMATCH'
                  ? 'ring-2 ring-amber-500 opacity-80'
                  : 'hover:border-amber-500 hover:shadow-md'
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                    loadingScenario === 'CONFIG_MISMATCH' ? 'bg-amber-500 text-white animate-pulse' : 'status-warning'
                  }`}>
                    {loadingScenario === 'CONFIG_MISMATCH' ? 'Injecting...' : 'High'}
                  </span>
                  <span className="font-extrabold text-title">2. Config Host Mismatch</span>
                </div>
                <span className="text-[11px] text-subtitle block">DATABASE_URL host name misconfigured</span>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition shrink-0">
                {loadingScenario === 'CONFIG_MISMATCH' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
              </div>
            </button>

            {/* Scenario 3 */}
            <button
              disabled={loadingScenario !== null}
              onClick={() => handleLaunchScenario('CODE_BUG')}
              className={`w-full text-left p-3.5 rounded-xl glass-panel border border-l-4 border-l-blue-500 theme-border text-xs flex items-center justify-between group transition-all ${
                loadingScenario === 'CODE_BUG'
                  ? 'ring-2 ring-blue-500 opacity-80'
                  : 'hover:border-blue-500 hover:shadow-md'
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                    loadingScenario === 'CODE_BUG' ? 'bg-blue-500 text-white animate-pulse' : 'status-healthy'
                  }`}>
                    {loadingScenario === 'CODE_BUG' ? 'Injecting...' : 'Code Bug'}
                  </span>
                  <span className="font-extrabold text-title">3. Login API 500 Code Bug</span>
                </div>
                <span className="text-[11px] text-subtitle block">String passed to Integer Prisma query</span>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition shrink-0">
                {loadingScenario === 'CODE_BUG' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
              </div>
            </button>
          </div>

          {/* Feedback & AI Agent Fix CTA */}
          {lastTriggered && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-2 animate-fadeIn mt-2">
              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Incident Injected Live!
                </span>
                <span className="text-[10px] font-mono font-normal">Topology Updated</span>
              </div>
              <p className="text-[11px] text-subtitle">
                System failure is active on the topology graph. Click below to launch AI Agent resolution loop.
              </p>
              <button
                onClick={() => onNavigateTab('command')}
                className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Fix Incident in AI Chat →</span>
              </button>
            </div>
          )}
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
            onClick={() => onNavigateTab('auditor')}
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
