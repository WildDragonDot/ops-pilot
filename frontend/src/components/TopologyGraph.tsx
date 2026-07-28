import React from 'react';
import { Server, Cpu, Database, Activity, ArrowRight, Radio } from 'lucide-react';

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
      icon: Server,
      color: 'blue'
    },
    {
      id: 'api',
      label: 'Node.js API',
      port: 3000,
      latency: '14ms',
      status: environmentStatus.api === 'RUNNING' ? 'RUNNING' : 'CRASHED',
      icon: Cpu,
      color: 'purple'
    },
    {
      id: 'postgres',
      label: 'PostgreSQL DB',
      port: 5432,
      latency: '4ms',
      status: environmentStatus.postgres === 'RUNNING' ? 'RUNNING' : 'STOPPED',
      icon: Database,
      color: 'indigo'
    },
    {
      id: 'redis',
      label: 'Redis Cache',
      port: 6379,
      latency: '1ms',
      status: environmentStatus.redis === 'RUNNING' ? 'RUNNING' : 'STOPPED',
      icon: Activity,
      color: 'amber'
    }
  ];

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-4">
      <div className="flex items-center justify-between border-b pb-3 theme-border">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider">
            Topology Map
          </span>
          <h2 className="text-base font-extrabold text-title mt-1">Infrastructure Service Cluster</h2>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
          environmentStatus.overall === 'HEALTHY' ? 'status-healthy glow-emerald' : 'status-danger glow-rose animate-pulse'
        }`}>
          Cluster {environmentStatus.overall}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {nodes.map((node) => {
          const Icon = node.icon;
          const isRunning = node.status === 'RUNNING';

          return (
            <div
              key={node.id}
              className={`p-4 rounded-xl border transition-all duration-300 ${
                isRunning
                  ? 'card-bg-subtle theme-border hover:border-blue-500/50 hover:shadow-lg'
                  : 'bg-rose-500/10 dark:bg-rose-950/20 border-rose-300 dark:border-rose-850 glow-rose'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl ${
                  node.color === 'blue' ? 'bg-blue-500/20 text-blue-500' :
                  node.color === 'purple' ? 'bg-purple-500/20 text-purple-500' :
                  node.color === 'indigo' ? 'bg-indigo-500/20 text-indigo-500' :
                  'bg-amber-500/20 text-amber-500'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase tracking-wider ${
                  isRunning ? 'status-healthy' : 'status-danger animate-pulse'
                }`}>
                  {node.status}
                </span>
              </div>

              <div className="mt-3 space-y-1">
                <span className="text-xs font-bold text-title block">{node.label}</span>
                <span className="text-[11px] text-subtitle font-mono block">Port {node.port}</span>
              </div>

              <div className="pt-2 mt-2 border-t theme-border flex items-center justify-between text-[10px] text-subtitle font-mono">
                <span>Latency: {node.latency}</span>
                <Radio className={`w-3 h-3 ${isRunning ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="card-bg-subtle p-3 rounded-xl border text-xs font-mono text-subtitle flex items-center justify-between">
        <span className="font-bold text-blue-500">Data Flow:</span>
        <span>Nginx (8080) ➔ Node API (3000) ➔ PostgreSQL (5432) & Redis (6379)</span>
      </div>
    </div>
  );
};
