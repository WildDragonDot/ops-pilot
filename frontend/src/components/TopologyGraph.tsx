import React from 'react';
import { Server, Cpu, Database, Activity, ArrowRight, Radio, Box, Globe, Code } from 'lucide-react';
import { Project } from '../types';

interface TopologyGraphProps {
  project?: Project | null;
  environmentStatus: {
    overall: 'HEALTHY' | 'DEGRADED' | 'DOWN';
    postgres: 'RUNNING' | 'STOPPED' | 'ERROR';
    redis: 'RUNNING' | 'STOPPED' | 'ERROR';
    api: 'RUNNING' | 'CRASHED' | 'STOPPED';
    nginx: 'UPSTREAM_502' | 'HEALTHY';
  };
}

export const TopologyGraph: React.FC<TopologyGraphProps> = ({ project, environmentStatus }) => {
  const envType = project?.environmentType || project?.runtimeType || 'Docker Compose';

  const getTopologyConfig = () => {
    if (envType.includes('Python') || envType.includes('FastAPI')) {
      return {
        stackLabel: 'Python / FastAPI Stack',
        pipeline: ['NGINX (80)', 'FastAPI / Uvicorn (8000)', 'PostgreSQL (5432) & Celery (6379)'],
        nodes: [
          {
            id: 'nginx',
            label: 'NGINX Reverse Proxy',
            port: 80,
            protocol: 'HTTP',
            latency: '2ms',
            status: environmentStatus.nginx === 'HEALTHY' ? 'RUNNING' : 'DOWN',
            icon: Server,
            accent: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20'
          },
          {
            id: 'api',
            label: 'FastAPI / Uvicorn',
            port: 8000,
            protocol: 'ASGI/Python',
            latency: '12ms',
            status: environmentStatus.api === 'RUNNING' ? 'RUNNING' : 'CRASHED',
            icon: Cpu,
            accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
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
            label: 'Celery / Redis Queue',
            port: 6379,
            protocol: 'ASYNC WORKER',
            latency: '1ms',
            status: environmentStatus.redis === 'RUNNING' ? 'RUNNING' : 'STOPPED',
            icon: Activity,
            accent: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
          }
        ]
      };
    }

    if (envType.includes('Kubernetes')) {
      return {
        stackLabel: 'Kubernetes Microservices',
        pipeline: ['Ingress NGINX (443)', 'K8s API Pod (8080)', 'Managed Cloud DB & Redis Sentinel'],
        nodes: [
          {
            id: 'nginx',
            label: 'Ingress NGINX Controller',
            port: 443,
            protocol: 'HTTPS/K8s',
            latency: '3ms',
            status: environmentStatus.nginx === 'HEALTHY' ? 'RUNNING' : 'DOWN',
            icon: Globe,
            accent: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20'
          },
          {
            id: 'api',
            label: 'K8s API Pod Replicas',
            port: 8080,
            protocol: 'Microservice',
            latency: '15ms',
            status: environmentStatus.api === 'RUNNING' ? 'RUNNING' : 'CRASHED',
            icon: Box,
            accent: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20'
          },
          {
            id: 'postgres',
            label: 'Managed Cloud PostgreSQL',
            port: 5432,
            protocol: 'Cloud SQL',
            latency: '5ms',
            status: environmentStatus.postgres === 'RUNNING' ? 'RUNNING' : 'STOPPED',
            icon: Database,
            accent: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
          },
          {
            id: 'redis',
            label: 'Redis Sentinel Pod',
            port: 6379,
            protocol: 'StatefulSet',
            latency: '1ms',
            status: environmentStatus.redis === 'RUNNING' ? 'RUNNING' : 'STOPPED',
            icon: Activity,
            accent: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
          }
        ]
      };
    }

    if (envType.includes('Node')) {
      return {
        stackLabel: 'Node.js Express / Nest Stack',
        pipeline: ['Nginx Load Balancer (8080)', 'Node.js API (3000)', 'PostgreSQL (5432) & Redis Cache'],
        nodes: [
          {
            id: 'nginx',
            label: 'Nginx Load Balancer',
            port: 8080,
            protocol: 'HTTP',
            latency: '2ms',
            status: environmentStatus.nginx === 'HEALTHY' ? 'RUNNING' : 'DOWN',
            icon: Server,
            accent: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20'
          },
          {
            id: 'api',
            label: 'Node.js Express API',
            port: 3000,
            protocol: 'REST/JSON',
            latency: '14ms',
            status: environmentStatus.api === 'RUNNING' ? 'RUNNING' : 'CRASHED',
            icon: Code,
            accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
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
            label: 'Redis Session Store',
            port: 6379,
            protocol: 'IN-MEMORY',
            latency: '1ms',
            status: environmentStatus.redis === 'RUNNING' ? 'RUNNING' : 'STOPPED',
            icon: Activity,
            accent: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
          }
        ]
      };
    }

    // Default Docker Compose Stack
    return {
      stackLabel: 'Docker Compose Stack',
      pipeline: ['Nginx Proxy (8080)', 'Node API (3000)', 'PostgreSQL (5432) & Redis (6379)'],
      nodes: [
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
      ]
    };
  };

  const config = getTopologyConfig();

  return (
    <div className="bg-white dark:bg-[#0d1117] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-[10px] font-semibold font-mono">
              Topology Map
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-[10px] font-semibold font-mono">
              {config.stackLabel}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Infrastructure Service Cluster</h2>
        </div>

        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
          environmentStatus.overall === 'HEALTHY'
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 animate-pulse'
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
        {config.nodes.map((node) => {
          const Icon = node.icon;
          const isRunning = node.status === 'RUNNING';

          return (
            <div
              key={node.id}
              className={`p-4 rounded-xl border transition-all duration-200 ${
                isRunning
                  ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-xs'
                  : 'bg-rose-500/10 border-rose-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl border ${node.accent}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase tracking-wider border ${
                  isRunning
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/30 animate-pulse'
                }`}>
                  {node.status}
                </span>
              </div>

              <div className="mt-3 space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">{node.label}</span>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  <span className="font-bold">Port {node.port}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{node.protocol}</span>
                </div>
              </div>

              <div className="pt-2 mt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                <span>Latency: <b className={isRunning ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 font-bold'}>{node.latency}</b></span>
                <Radio className={`w-3.5 h-3.5 ${isRunning ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 animate-ping'}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Pipeline Data Trace */}
      <div className="bg-slate-50 dark:bg-slate-900/60 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono">
          <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-extrabold tracking-wider">
            TRACE
          </span>
          <span className="font-bold text-slate-900 dark:text-slate-100">Pipeline:</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
          {config.pipeline.map((step, idx) => (
            <React.Fragment key={idx}>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold">{step}</span>
              {idx < config.pipeline.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
