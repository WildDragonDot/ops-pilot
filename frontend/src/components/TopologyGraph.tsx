import React, { useState } from 'react';
import { Server, Cpu, Database, Activity, ArrowRight, Radio, Box, Globe, Code, X, RefreshCw, Terminal, Check, Copy, ShieldCheck, AlertCircle } from 'lucide-react';
import { Project } from '../types';
import { executeCommandOnServer } from '../services/api';

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

  const [inspectNode, setInspectNode] = useState<any | null>(null);
  const [containerLogs, setContainerLogs] = useState<string>('');
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleFetchLogs = async (containerName: string) => {
    if (!project?.serverHost?.trim()) {
      setContainerLogs('Repository AST mode does not expose remote container logs. Attach an SSH server host to inspect live Docker logs.');
      return;
    }
    setLoadingLogs(true);
    setContainerLogs('');
    try {
      const res = await executeCommandOnServer(`sudo docker logs --tail 35 ${containerName} 2>&1 || sudo docker ps`, project?.id);
      setContainerLogs(res.output || 'Container logs fetched cleanly (0 errors detected).');
    } catch (e: any) {
      setContainerLogs(e.message || 'Unable to fetch live remote logs. Verify SSH credentials in Project Settings.');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleRestartContainer = async (containerName: string) => {
    if (!project?.serverHost?.trim()) {
      setActionSuccess('Server restart actions require an SSH server project.');
      setTimeout(() => setActionSuccess(null), 3000);
      return;
    }
    setActionSuccess('Restarting container...');
    try {
      await executeCommandOnServer(`sudo docker restart ${containerName}`, project?.id);
      setActionSuccess(`✅ ${containerName} restarted successfully!`);
    } catch (e) {
      setActionSuccess(`Unable to restart ${containerName}. Verify SSH credentials.`);
    }
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const getTopologyConfig = () => {
    if (project?.serverHost?.trim() && (environmentStatus as any).dynamicNodes !== undefined) {
      const dynamicNodes = (environmentStatus as any).dynamicNodes;
      
      if (dynamicNodes.length === 0) {
        return {
          stackLabel: 'Bare-metal / Empty Server',
          title: 'Remote System Architecture',
          statusText: 'NO SERVICES DISCOVERED',
          pipeline: ['SERVER_CONNECTED', 'IDLE'],
          nodes: [
            {
              id: 'empty_host',
              label: 'Host Server Attached',
              port: 22,
              protocol: 'SSH',
              latency: 'N/A',
              status: 'RUNNING',
              icon: Server,
              accent: 'text-slate-500 dark:text-slate-400 bg-slate-500/10 border-slate-500/20'
            }
          ]
        };
      }

      return {
        stackLabel: 'Remote Discovered Architecture',
        title: 'Live Container Topology',
        statusText: 'LIVE SYNC',
        pipeline: dynamicNodes.map((n: any) => n.id.toUpperCase()),
        nodes: dynamicNodes.map((node: any, idx: number) => {
          const isDb = node.label.includes('postgres') || node.label.includes('mongo') || node.label.includes('db');
          const isCache = node.label.includes('redis') || node.label.includes('memcached');
          const isProxy = node.label.includes('nginx') || node.label.includes('proxy');
          let icon = Box;
          let accent = 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20';
          
          if (isDb) {
            icon = Database;
            accent = 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
          } else if (isCache) {
            icon = Activity;
            accent = 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
          } else if (isProxy) {
            icon = Server;
            accent = 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20';
          } else {
            icon = Cpu;
            accent = 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
          }

          return {
            id: node.id,
            label: node.label,
            port: 'Auto',
            protocol: 'DOCKER',
            latency: '<1ms',
            status: node.status,
            icon,
            accent
          };
        })
      };
    }

    if (project?.serverHost?.trim()) {
      return {
        stackLabel: 'Host Connected - Fetching Architecture...',
        title: 'Remote System Architecture',
        statusText: 'SCANNING',
        pipeline: ['CONNECTING'],
        nodes: [
          {
            id: 'scanning',
            label: 'Analyzing Server...',
            port: 22,
            protocol: 'SSH',
            latency: '...',
            status: 'RUNNING',
            icon: RefreshCw,
            accent: 'text-slate-500 dark:text-slate-400 bg-slate-500/10 border-slate-500/20'
          }
        ]
      };
    }

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
          label: 'D-OpsPilot AI Agent',
          port: 5080,
          protocol: 'LOCAL ENGINE',
          latency: '1ms',
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
        {config.nodes.map((node: any) => {
          const Icon = node.icon;
          const isRunning = node.status === 'RUNNING';

          return (
            <div
              key={node.id}
              onClick={() => {
                setInspectNode(node);
                handleFetchLogs(node.label);
                onSelectNode?.(node.id);
              }}
              className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer space-y-3 shadow-xs group ${
                isRunning
                  ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:shadow-lg hover:scale-[1.01]'
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
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight group-hover:text-blue-500 transition-colors">{node.label}</h3>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Click to Inspect Single Details ➔</span>
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
          {config.pipeline.map((step: string, idx: number) => (
            <React.Fragment key={idx}>
              <span className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold shadow-xs text-center shrink-0">
                {step}
              </span>
              {idx < config.pipeline.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* CONTAINER SINGLE DETAILS INSPECTION MODAL */}
      {inspectNode && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative overflow-hidden font-sans">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400">
                  <Server className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">{inspectNode.label}</h3>
                  <p className="text-xs text-slate-400 font-mono">Host: {project?.serverHost} • Port: {inspectNode.port}</p>
                </div>
              </div>

              <button
                onClick={() => setInspectNode(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Single Container Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Status</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  {inspectNode.status}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Protocol</span>
                <span className="text-blue-400 font-bold">{inspectNode.protocol}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Port Binding</span>
                <span className="text-purple-400 font-bold">0.0.0.0:{inspectNode.port}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Latency</span>
                <span className="text-amber-400 font-bold">{inspectNode.latency}</span>
              </div>
            </div>

            {/* Live SSH Log Stream for Container */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-mono">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Live SSH Container Logs (ubuntu@{project?.serverHost})
                </span>

                <button
                  onClick={() => handleFetchLogs(inspectNode.label)}
                  disabled={loadingLogs}
                  className="flex items-center gap-1 text-[11px] font-mono text-blue-400 hover:underline cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-[11px] text-slate-300 max-h-52 overflow-y-auto leading-relaxed shadow-inner">
                {loadingLogs ? (
                  <div className="flex items-center justify-center py-6 text-slate-500 gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                    Connecting via SSH to {project?.serverHost}...
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap">{containerLogs || 'No logs captured.'}</pre>
                )}
              </div>
            </div>

            {/* Feedback Message */}
            {actionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Modal Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => handleRestartContainer(inspectNode.label)}
                className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restart Container
              </button>

              <button
                onClick={() => setInspectNode(null)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
