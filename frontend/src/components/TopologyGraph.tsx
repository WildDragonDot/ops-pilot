import React from 'react';
import { Server, Cpu, Database, Activity, ArrowRight, Radio, Box, Globe, Code } from 'lucide-react';
import { Project } from '../types';

interface TopologyGraphProps {
  project?: Project | null;
  onSelectNode?: (nodeKey: string) => void;
  environmentStatus: {
    overall: 'HEALTHY' | 'DEGRADED' | 'DOWN';
    postgres: 'RUNNING' | 'STOPPED' | 'ERROR';
    redis: 'RUNNING' | 'STOPPED' | 'ERROR';
    api: 'RUNNING' | 'CRASHED' | 'STOPPED';
    nginx: 'UPSTREAM_502' | 'HEALTHY';
  };
}

export const TopologyGraph: React.FC<TopologyGraphProps> = ({ project, environmentStatus, onSelectNode }) => {
  const envType = project?.environmentType || project?.runtimeType || 'Docker Compose';

  const getTopologyConfig = () => {
    if (!project?.serverHost?.trim()) {
      return {
        stackLabel: 'Local Sandbox Engine',
        title: 'Local Workspace Topology',
        statusText: 'SANDBOX ACTIVE',
        pipeline: ['LOCAL_CODE', 'AST_SCANNER', 'CLIENT_VAULT', 'OPSPILOT_AGENT'],
        nodes: [
          {
            id: 'code',
            label: 'Local Codebase',
            port: 5080,
            protocol: 'FILESYSTEM',
            latency: '0ms',
            status: 'RUNNING',
            icon: Code,
            accent: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20'
          },
          {
            id: 'ast',
            label: 'AST Static Scanner',
            port: 5080,
            protocol: 'AST/SWC',
            latency: '1ms',
            status: 'RUNNING',
            icon: Cpu,
            accent: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20'
          },
          {
            id: 'vault',
            label: 'Client Vault',
            port: 5080,
            protocol: 'WEBCRYPTO',
            latency: '0ms',
            status: 'RUNNING',
            icon: Database,
            accent: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
          },
          {
            id: 'agent',
            label: 'OpsPilot AI Agent',
            port: 5080,
            protocol: 'LOCAL ENGINE',
            latency: '1ms',
            status: 'RUNNING',
            icon: Activity,
            accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
          }
        ]
      };
    }

    if (envType.includes('Python') || envType.includes('FastAPI')) {
      return {
        stackLabel: 'Python / FastAPI Stack',
        pipeline: ['NGINX:80', 'FASTAPI:8000', 'POSTGRES:5432', 'CELERY:6379'],
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
            label: 'FastAPI / Uvicorn API',
            port: 8000,
            protocol: 'ASGI/Python',
            latency: '12ms',
            status: environmentStatus.api === 'RUNNING' ? 'RUNNING' : 'CRASHED',
            icon: Cpu,
            accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
          },
          {
            id: 'postgres',
            label: 'PostgreSQL Database',
            port: 5432,
            protocol: 'TCP/SQL',
            latency: '4ms',
            status: environmentStatus.postgres === 'RUNNING' ? 'RUNNING' : 'STOPPED',
            icon: Database,
            accent: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
          },
          {
            id: 'redis',
            label: 'Celery / Redis Worker',
            port: 6379,
            protocol: 'Redis Queue',
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
        pipeline: ['INGRESS:443', 'K8S_POD:8080', 'CLOUD_DB:5432', 'REDIS:6379'],
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
            label: 'Redis Sentinel Cluster',
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
        pipeline: ['NGINX:8080', 'NODE_API:3000', 'POSTGRES:5432', 'REDIS:6379'],
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
            label: 'PostgreSQL Database',
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

    // Real Discovered Production Server Stack
    return {
      stackLabel: `AWS EC2 Production Stack (${project?.serverHost || '34.224.80.31'})`,
      pipeline: ['NANOMDM:8080', 'NANODEP:8082', 'POSTGRES:5434', 'SCEP:8081', 'REDIS:6379'],
      nodes: [
        {
          id: 'nanomdm',
          label: 'finance-lock-nanomdm',
          port: 8080,
          protocol: 'HTTP/Go',
          latency: '2ms',
          status: 'RUNNING',
          icon: Server,
          accent: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20'
        },
        {
          id: 'nanodep',
          label: 'finance-lock-nanodep',
          port: 8082,
          protocol: 'HTTP/Go',
          latency: '3ms',
          status: 'RUNNING',
          icon: Globe,
          accent: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20'
        },
        {
          id: 'postgres',
          label: 'finance-lock-postgres',
          port: 5434,
          protocol: 'TCP/Timescale',
          latency: '4ms',
          status: environmentStatus.postgres === 'RUNNING' ? 'RUNNING' : 'RUNNING',
          icon: Database,
          accent: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
        },
        {
          id: 'scep',
          label: 'finance-lock-scep',
          port: 8081,
          protocol: 'HTTP/PKI',
          latency: '2ms',
          status: 'RUNNING',
          icon: Activity,
          accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        },
        {
          id: 'redis',
          label: 'finance-lock-redis',
          port: 6379,
          protocol: 'IN-MEMORY',
          latency: '1ms',
          status: environmentStatus.redis === 'RUNNING' ? 'RUNNING' : 'RUNNING',
          icon: Activity,
          accent: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
        }
      ]
    };
  };

  const config = getTopologyConfig();

  return (
    <div className="bg-white dark:bg-[#0d1117] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs font-sans">
      
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

      {/* 2x2 UNIFIED GLASSMORPHIC NODES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {config.nodes.map((node) => {
          const Icon = node.icon;
          const isRunning = node.status === 'RUNNING';

          return (
            <div
              key={node.id}
              onClick={() => onSelectNode?.(node.id)}
              className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer space-y-3 shadow-xs ${
                isRunning
                  ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-blue-500/50'
                  : 'bg-rose-500/10 border-rose-500/30'
              }`}
            >
              {/* Header: Icon, Service Name & Status Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${node.accent}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">{node.label}</h3>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Container Service</span>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-extrabold uppercase tracking-wider flex items-center gap-1.5 border ${
                  isRunning
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  {node.status}
                </span>
              </div>

              {/* Integrated Metadata Bar: Port, Protocol & Latency */}
              <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400">
                    Port <b className="text-slate-900 dark:text-slate-100 font-bold">{node.port}</b>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold text-[9px]">
                    {node.protocol}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Latency:</span>
                  <b className={isRunning ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 font-bold'}>{node.latency}</b>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 1-LINE HORIZONTAL SCROLL-FREE TRACE PIPELINE */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono border-b border-slate-200 dark:border-slate-800 pb-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-extrabold tracking-wider text-[9px]">
              TRACE
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">Data Pipeline Flow</span>
          </div>
          <span className="text-slate-500 text-[9px] font-mono">ACTIVE ROUTE</span>
        </div>

        <div className="flex items-center justify-between gap-1 text-[10px] font-mono py-0.5">
          {config.pipeline.map((step, idx) => (
            <React.Fragment key={idx}>
              <span className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold shadow-xs text-center shrink-0">
                {step}
              </span>
              {idx < config.pipeline.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
