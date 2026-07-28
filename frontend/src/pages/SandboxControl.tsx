import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Activity, Server, Database, Cpu, Check, RefreshCw } from 'lucide-react';
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
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [injectingKey, setInjectingKey] = useState<string | null>(null);

  const env = project?.environmentStatus || {
    overall: 'HEALTHY',
    postgres: 'RUNNING',
    redis: 'RUNNING',
    api: 'RUNNING',
    nginx: 'HEALTHY'
  };

  const [activeOutageBanner, setActiveOutageBanner] = useState<string | null>(null);

  const handleReset = async () => {
    setIsResetting(true);
    await onResetEnv();
    setIsResetting(false);
    setActiveOutageBanner(null);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 2500);
  };

  const handleInject = async (key: string) => {
    setInjectingKey(key);
    await onInjectFailure(key);
    setInjectingKey(null);
    setActiveOutageBanner(key);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.35 }}
      className="space-y-6 max-w-5xl mx-auto font-sans"
    >
      
      {/* Page Header */}
      <div className="bg-white dark:bg-[#0d1117] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold font-mono">
              Chaos Testing & Sandbox Simulator
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Failure Injection Engine</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Safely simulate production outages, host misconfigurations, and code bugs in an isolated sandbox environment to evaluate OpsPilot AI's autonomous recovery agent.
          </p>
        </div>
      </div>

      {/* Active Outage Banner Notice (Optional Navigation) */}
      {activeOutageBanner && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>Outage simulated successfully! Process monitor status updated below.</span>
          </div>
          <button
            onClick={() => onNavigateTab('command')}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition whitespace-nowrap self-start sm:self-auto shadow-xs"
          >
            View AI Agent in Command Center →
          </button>
        </div>
      )}

      {/* Live Environment Process Monitor */}
      <div className="bg-white dark:bg-[#0d1117] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <span>Live Environment Process Monitor</span>
          </h2>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold transition disabled:opacity-50"
          >
            {isResetting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : resetSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            <span>{isResetting ? 'Resetting...' : resetSuccess ? 'Services Reset Healthy' : 'Reset All Services to Healthy'}</span>
          </motion.button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center space-y-1.5">
            <Server className="w-5 h-5 mx-auto text-blue-500" />
            <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">Nginx Proxy</span>
            <span className={`inline-block text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded border ${
              env.nginx === 'HEALTHY'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
            }`}>{env.nginx}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center space-y-1.5">
            <Cpu className="w-5 h-5 mx-auto text-purple-500" />
            <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">Node.js API</span>
            <span className={`inline-block text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded border ${
              env.api === 'RUNNING'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
            }`}>{env.api}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center space-y-1.5">
            <Database className="w-5 h-5 mx-auto text-indigo-500" />
            <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">PostgreSQL DB</span>
            <span className={`inline-block text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded border ${
              env.postgres === 'RUNNING'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
            }`}>{env.postgres}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center space-y-1.5">
            <Activity className="w-5 h-5 mx-auto text-amber-500" />
            <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">Redis Cache</span>
            <span className={`inline-block text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded border ${
              env.redis === 'RUNNING'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
            }`}>{env.redis}</span>
          </div>
        </div>
      </div>

      {/* Scenario Injection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            key: 'DATABASE_STOPPED',
            title: 'PostgreSQL Container Down (502 Bad Gateway)',
            severity: 'CRITICAL',
            desc: 'Simulates a dead PostgreSQL database container, causing Prisma client initialization errors and Nginx 502 Bad Gateway response.',
          },
          {
            key: 'CONFIG_MISMATCH',
            title: 'Environment Hostname Mismatch',
            severity: 'HIGH',
            desc: 'Injects an invalid DATABASE_URL hostname into .env.production, causing DNS lookup failures during API boot.',
          },
          {
            key: 'CODE_BUG',
            title: 'Login Controller 500 Type Mismatch',
            severity: 'HIGH',
            desc: 'Triggers a PrismaClientValidationError in auth.controller.ts by passing a string ID to a query expecting an integer.',
          }
        ].map(sc => {
          const isInjectingThis = injectingKey === sc.key;

          return (
            <div key={sc.key} className="bg-white dark:bg-[#0d1117] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 shadow-xs transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                    sc.severity === 'CRITICAL'
                      ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                  }`}>
                    {sc.severity}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{sc.key}</span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">{sc.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">{sc.desc}</p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleInject(sc.key)}
                disabled={Boolean(injectingKey)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition"
              >
                {isInjectingThis ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Launching AI Agent...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Inject Outage & Launch Agent</span>
                  </>
                )}
              </motion.button>
            </div>
          );
        })}
      </div>

    </motion.div>
  );
};
