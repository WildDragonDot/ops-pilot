import React from 'react';
import { Play, RotateCcw, Activity, Server, Database, Cpu } from 'lucide-react';
import { Project } from '../types';

interface SandboxControlProps {
  project: Project | null;
  onInjectFailure: (scenarioKey: string) => void;
  onResetEnv: () => void;
  onNavigateTab: (tab: string) => void;
}

export const SandboxControl: React.FC<SandboxControlProps> = ({
  project,
  onInjectFailure,
  onResetEnv,
  onNavigateTab
}) => {
  const env = project?.environmentStatus || {
    overall: 'HEALTHY',
    postgres: 'RUNNING',
    redis: 'RUNNING',
    api: 'RUNNING',
    nginx: 'HEALTHY'
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
            Interactive Failure Sandbox
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-white mt-1">Live Demo Failure Injector</h1>
        <p className="text-xs text-slate-400 mt-1">
          Simulate realistic production failures across Docker services, environment configuration, and backend route handlers to demonstrate OpsPilot AI's autonomous recovery loop to hackathon judges.
        </p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span>Live Environment Process Monitor</span>
          </h2>

          <button
            onClick={onResetEnv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Services to Healthy</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
            <Server className="w-5 h-5 mx-auto text-blue-400" />
            <span className="text-xs font-bold block">Nginx Reverse Proxy</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              env.nginx === 'HEALTHY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>{env.nginx}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
            <Cpu className="w-5 h-5 mx-auto text-purple-400" />
            <span className="text-xs font-bold block">Node.js API</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              env.api === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>{env.api}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
            <Database className="w-5 h-5 mx-auto text-indigo-400" />
            <span className="text-xs font-bold block">PostgreSQL DB</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              env.postgres === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>{env.postgres}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
            <Activity className="w-5 h-5 mx-auto text-amber-400" />
            <span className="text-xs font-bold block">Redis Cache</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              env.redis === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>{env.redis}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-rose-500/30 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded uppercase">
                Critical Failure
              </span>
              <span className="text-xs font-mono text-slate-500">Scenario 1</span>
            </div>
            <h3 className="text-base font-bold text-white">PostgreSQL Container Down (502 Bad Gateway)</h3>
            <p className="text-xs text-slate-400">
              Stops the PostgreSQL database container. Causes the Node.js API process to exit on startup due to failed Prisma client initialization, resulting in Nginx 502 upstream errors.
            </p>
          </div>

          <button
            onClick={() => {
              onInjectFailure('DATABASE_STOPPED');
              onNavigateTab('command');
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 transition"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Inject Scenario 1 & Test Agent</span>
          </button>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded uppercase">
                Config Issue
              </span>
              <span className="text-xs font-mono text-slate-500">Scenario 2</span>
            </div>
            <h3 className="text-base font-bold text-white">DATABASE_URL Hostname Mismatch</h3>
            <p className="text-xs text-slate-400">
              Changes <code className="text-amber-400 font-mono">DATABASE_URL</code> host from "postgres" to "db". Docker network cannot resolve "db", throwing <code className="font-mono text-slate-300">ENOTFOUND</code> DNS failure.
            </p>
          </div>

          <button
            onClick={() => {
              onInjectFailure('CONFIG_MISMATCH');
              onNavigateTab('command');
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/30 transition"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Inject Scenario 2 & Test Agent</span>
          </button>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-blue-500/30 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded uppercase">
                Code Bug
              </span>
              <span className="text-xs font-mono text-slate-500">Scenario 3</span>
            </div>
            <h3 className="text-base font-bold text-white">Login API 500 Error (Prisma Type Mismatch)</h3>
            <p className="text-xs text-slate-400">
              Passes raw <code className="text-blue-400 font-mono">req.params.id</code> string into integer database column query, triggering unhandled Prisma Client Validation exception.
            </p>
          </div>

          <button
            onClick={() => {
              onInjectFailure('CODE_BUG');
              onNavigateTab('command');
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Inject Scenario 3 & Test Agent</span>
          </button>
        </div>
      </div>
    </div>
  );
};
