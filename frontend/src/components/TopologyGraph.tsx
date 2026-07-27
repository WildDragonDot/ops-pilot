import React from 'react';
import { Server, Cpu, Database, Activity, ArrowRight } from 'lucide-react';

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
      latency: '2ms',
      status: environmentStatus.nginx === 'HEALTHY' ? 'RUNNING' : 'DOWN',
      icon: Server
    },
    {
      id: 'api',
      label: 'Node.js API',
      port: 3000,
      latency: '14ms',
      status: environmentStatus.api === 'RUNNING' ? 'RUNNING' : 'CRASHED',
      icon: Cpu
    },
    {
      id: 'postgres',
      label: 'PostgreSQL DB',
      port: 5432,
      latency: '4ms',
      status: environmentStatus.postgres === 'RUNNING' ? 'RUNNING' : 'STOPPED',
      icon: Database
    },
    {
      id: 'redis',
      label: 'Redis Cache',
      port: 6379,
      latency: '1ms',
      status: environmentStatus.redis === 'RUNNING' ? 'RUNNING' : 'STOPPED',
      icon: Activity
    }
  ];

  return (
    <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-100">Service Infrastructure Topology</h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time container health & ping latency map</p>
        </div>

        <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${
          environmentStatus.overall === 'HEALTHY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        }`}>
          Cluster {environmentStatus.overall}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {nodes.map((node) => {
          const Icon = node.icon;
          const isRunning = node.status === 'RUNNING';

          return (
            <div
              key={node.id}
              className={`p-3.5 rounded-lg border transition ${
                isRunning
                  ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  : 'bg-rose-950/20 border-rose-800/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded bg-slate-900 text-slate-300">
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border uppercase ${
                  isRunning ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {node.status}
                </span>
              </div>

              <div className="mt-3 space-y-0.5">
                <span className="text-xs font-bold text-slate-100 block">{node.label}</span>
                <span className="text-[10px] text-slate-400 font-mono block">Port {node.port}</span>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-900/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Latency</span>
                <b className="text-slate-200">{node.latency}</b>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-blue-400 font-semibold">Traffic Flow:</span>
          <span>Nginx (8080)</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          <span>Node API (3000)</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          <span>Postgres (5432) & Redis (6379)</span>
        </div>
      </div>
    </div>
  );
};
