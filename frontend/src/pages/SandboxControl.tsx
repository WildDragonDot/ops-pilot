import React from 'react';
import { motion } from 'framer-motion';
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
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.35 }}
      className="space-y-6 max-w-5xl mx-auto font-sans"
    >
      
      {/* Page Header */}
      <div className="glass-panel p-6 rounded-2xl theme-border border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold font-mono">
              Chaos Testing & Sandbox Simulator
            </span>
          </div>
          <h1 className="text-2xl font-bold text-title tracking-tight">Failure Injection Engine</h1>
          <p className="text-xs text-subtitle max-w-2xl leading-relaxed">
            Safely simulate production outages, host misconfigurations, and code bugs in a isolated sandbox environment to evaluate OpsPilot AI's autonomous recovery agent.
          </p>
        </div>
      </div>

      {/* Live Environment Process Monitor */}
      <div className="glass-panel p-6 rounded-2xl theme-border border space-y-4">
        <div className="flex items-center justify-between border-b theme-border pb-3">
          <h2 className="text-xs font-bold text-title uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <span>Live Environment Process Monitor</span>
          </h2>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onResetEnv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-500 border border-emerald-500/30 rounded-xl text-xs font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Services to Healthy</span>
          </motion.button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl card-bg-subtle border theme-border text-center space-y-1">
            <Server className="w-5 h-5 mx-auto text-blue-500" />
            <span className="text-xs font-bold block text-title">Nginx Proxy</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              env.nginx === 'HEALTHY' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
            }`}>{env.nginx}</span>
          </div>

          <div className="p-4 rounded-xl card-bg-subtle border theme-border text-center space-y-1">
            <Cpu className="w-5 h-5 mx-auto text-purple-500" />
            <span className="text-xs font-bold block text-title">Node.js API</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              env.api === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
            }`}>{env.api}</span>
          </div>

          <div className="p-4 rounded-xl card-bg-subtle border theme-border text-center space-y-1">
            <Database className="w-5 h-5 mx-auto text-indigo-500" />
            <span className="text-xs font-bold block text-title">PostgreSQL DB</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              env.postgres === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
            }`}>{env.postgres}</span>
          </div>

          <div className="p-4 rounded-xl card-bg-subtle border theme-border text-center space-y-1">
            <Activity className="w-5 h-5 mx-auto text-amber-500" />
            <span className="text-xs font-bold block text-title">Redis Cache</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              env.redis === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
            }`}>{env.redis}</span>
          </div>
        </div>
      </div>

      {/* Scenario Injection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        ].map(sc => (
          <div key={sc.key} className="glass-panel p-6 rounded-2xl theme-border border space-y-4 flex flex-col justify-between hover:border-blue-500/40 transition">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  sc.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                }`}>
                  {sc.severity}
                </span>
                <span className="text-xs font-mono text-subtitle">{sc.key}</span>
              </div>
              <h3 className="text-sm font-bold text-title leading-snug">{sc.title}</h3>
              <p className="text-xs text-subtitle leading-relaxed">{sc.desc}</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onInjectFailure(sc.key);
                onNavigateTab('command');
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-950/30 transition"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Inject Outage & Launch Agent</span>
            </motion.button>
          </div>
        ))}
      </div>

    </motion.div>
  );
};
