import React from 'react';
import { Server, Cpu, Database, Activity, ArrowRight, Radio, ShieldCheck } from 'lucide-react';

interface TopologyGraphProps {
  environmentStatus: {
    overall: 'HEALTHY' | 'DEGRADED' | 'DOWN';
    postgres: 'RUNNING' | 'STOPPED' | 'ERROR';
    redis: 'RUNNING' | 'STOPPED' | 'ERROR';
    api: 'RUNNING' | 'CRASHED' | 'STOPPED';
    nginx: 'UPSTREAM_502' | 'HEALTHY';
  };
}

export const TopologyGraph: React.FC<TopologyGraphProps> = ({ environmentStatus }) => {
  const nodes = [
    {
      id: 'nginx',
      label: 'Nginx Proxy',
      port: 8080,
      protocol: 'HTTP',
      latency: '2ms',
      status: environmentStatus.nginx === 'HEALTHY' ? 'RUNNING' : 'DOWN',
      icon: Server,
      accent: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20'
    },
    {
      id: 'api',
      label: 'Node.js API',
      port: 3000,
      protocol: 'REST/JSON',
      latency: '14ms',
      status: environmentStatus.api === 'RUNNING' ? 'RUNNING' : 'CRASHED',
      icon: Cpu,
      accent: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20'
    },
    {
      id: 'postgres',
      label: 'PostgreSQL DB',
      port: 5432,
      protocol: 'TCP/SQL',
      latency: '4ms',
      status: environmentStatus.postgres === 'RUNNING' ? 'RUNNING' : 'STOPPED',
      icon: Database,
      accent: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
    },
    {
      id: 'redis',
      label: 'Redis Cache',
      port: 6379,
      protocol: 'IN-MEMORY',
      latency: '1ms',
      status: environmentStatus.redis === 'RUNNING' ? 'RUNNING' : 'STOPPED',
      icon: Activity,
      accent: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
    }
  ];

  return (
    <div className="glass-panel p-6 rounded-2xl theme-border border space-y-5">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b pb-4 theme-border">
        <div className="space-y-0.5">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-semibold font-mono">
            Topology Map
          </span>
          <h2 className="text-lg font-bold text-title tracking-tight font-display">Infrastructure Service Cluster</h2>
        </div>

        <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold border shadow-sm ${
          environmentStatus.overall === 'HEALTHY' ? 'status-healthy' : 'status-danger animate-pulse'
        }`}>
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${environmentStatus.overall === 'HEALTHY' ? 'bg-emerald-400' : 'bg-rose-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${environmentStatus.overall === 'HEALTHY' ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
          </span>
          <span>CLUSTER {environmentStatus.overall}</span>
        </div>
      </div>

      {/* Nodes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {nodes.map((node) => {
          const Icon = node.icon;
          const isRunning = node.status === 'RUNNING';

          return (
            <div
              key={node.id}
              className={`p-4 rounded-xl border transition-all duration-200 ${
                isRunning
                  ? 'card-bg-subtle theme-border hover:border-blue-500/50 hover:shadow-md'
                  : 'status-danger border-rose-300 dark:border-rose-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl border ${node.accent}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase tracking-wider ${
                  isRunning ? 'status-healthy' : 'status-danger animate-pulse'
                }`}>
                  {node.status}
                </span>
              </div>

              <div className="mt-3 space-y-0.5">
                <span className="text-xs font-extrabold text-title block">{node.label}</span>
                <div className="flex items-center justify-between text-[10px] font-mono text-subtitle">
                  <span className="font-bold">Port {node.port}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold card-bg-subtle text-subtitle border theme-border">{node.protocol}</span>
                </div>
              </div>

              <div className="pt-2 mt-3 border-t theme-border flex items-center justify-between text-[10px] text-subtitle font-mono">
                <span>Latency: <b className={isRunning ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 font-bold'}>{node.latency}</b></span>
                <Radio className={`w-3.5 h-3.5 ${isRunning ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 animate-ping'}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Pipeline Data Trace */}
      <div className="card-bg-subtle px-4 py-2.5 rounded-xl border theme-border flex items-center justify-between gap-4 overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono">
          <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-extrabold tracking-wider">
            TRACE
          </span>
          <span className="font-bold text-title">Pipeline:</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
          <span className="px-2 py-0.5 rounded theme-pill border font-semibold">Nginx Proxy (8080)</span>
          <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="px-2 py-0.5 rounded theme-pill border font-semibold">Node API (3000)</span>
          <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="px-2 py-0.5 rounded theme-pill border font-semibold">PostgreSQL (5432) & Redis (6379)</span>
        </div>
      </div>
    </div>
  );
};
