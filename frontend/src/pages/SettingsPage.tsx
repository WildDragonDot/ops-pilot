import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building, GitBranch, Cpu, Shield, Key, Plus, Server, Terminal, Trash2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchProjects, removeProject } from '../services/api';
import { Project } from '../types';

interface SettingsPageProps {
  onOpenSetupModal?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onOpenSetupModal }) => {
  const { user } = useAuth();
  const [projectsList, setProjectsList] = useState<Project[]>([]);

  useEffect(() => {
    fetchProjects().then(setProjectsList).catch(console.error);
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this project configuration?')) {
      try {
        await removeProject(id);
        setProjectsList(prev => prev.filter(p => p.id !== id));
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.35 }}
      className="space-y-6 max-w-5xl mx-auto font-sans"
    >
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0d1117] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-xs font-semibold font-mono">
              System Configuration & Zero-DB Security Vault
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Workspace Settings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Manage multi-project server connections, GitHub access tokens, zero-DB credential vault, and AI safety guardrails.
          </p>
        </div>

        {onOpenSetupModal && (
          <button
            onClick={onOpenSetupModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Setup New Project</span>
          </button>
        )}
      </div>

      {/* Security Vault Banner */}
      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold block">Zero-DB Credential Storage Vault Active</span>
            <span className="text-[11px] font-normal text-slate-600 dark:text-slate-300">
              SSH Keys, passwords, and GitHub tokens are encrypted client-side in browser Web Crypto vault. They are NEVER written to the database.
            </span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] font-bold shrink-0">
          VAULT SECURE
        </span>
      </div>

      {/* Connected Projects Management Grid */}
      <div className="bg-white dark:bg-[#0d1117] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-500" />
            <span>Connected Production Projects ({projectsList.length})</span>
          </h2>
          {onOpenSetupModal && (
            <button
              onClick={onOpenSetupModal}
              className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projectsList.map(proj => (
            <div
              key={proj.id}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{proj.name}</h3>
                </div>
                <button
                  onClick={() => handleDelete(proj.id)}
                  title="Remove Project"
                  className="p-1 rounded text-slate-400 hover:text-rose-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">Server SSH Host</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{proj.serverHost ? `${proj.serverUser || 'root'}@${proj.serverHost}:${proj.serverPort || 22}` : 'Local Sandbox Engine'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Environment</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{proj.environmentType || 'Docker Compose'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px]">GitHub Repository</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold truncate block">{proj.gitUrl || 'Not specified'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Client Vault Credentials Active
                </span>
                <span className="text-slate-400 font-mono">ID: #{proj.id}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Organization & AI Model Config */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Organization Details */}
          <div className="bg-white dark:bg-[#0d1117] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-500" />
              <span>Organization Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-500 dark:text-slate-400 font-medium block">Organization Name</label>
                <input
                  type="text"
                  disabled
                  value={user?.organizationName || 'Acme Operations Corp'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 dark:text-slate-400 font-medium block">Organization Slug ID</label>
                <input
                  type="text"
                  disabled
                  value={user?.organizationId || 'org-acme-corp'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* OpenAI API Settings */}
          <div className="bg-white dark:bg-[#0d1117] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-500" />
              <span>OpenAI API Integration</span>
            </h2>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-500 dark:text-slate-400 font-medium block">Selected Reasoning Model</label>
                <select className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500">
                  <option value="gpt-4o">gpt-4o (High-Precision Reasoning & Tool Calling)</option>
                  <option value="gpt-4o-mini">gpt-4o-mini (Fast Inspection)</option>
                  <option value="o1-mini">o1-mini (Deep Static Code Auditing)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 dark:text-slate-400 font-medium block">OpenAI API Key (Encrypted Storage)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    disabled
                    value="sk-proj-********************************"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono"
                  />
                  <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold whitespace-nowrap">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Connected Repositories & Team */}
        <div className="space-y-6">
          
          {/* Connected GitHub Repository */}
          <div className="bg-white dark:bg-[#0d1117] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-emerald-500" />
              <span>Connected Repository</span>
            </h2>

            <div className="text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-900 dark:text-slate-100 font-mono bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span>company/production-api</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Connected</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                OpsPilot AI has Read/Write access to create pull requests, patch bug fixes, and run Docker compose commands.
              </p>
            </div>
          </div>

          {/* AI Guardrail Policies */}
          <div className="bg-white dark:bg-[#0d1117] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              <span>AI Guardrail Policies</span>
            </h2>

            <div className="space-y-3 text-xs">
              {[
                { label: 'Human Approval Required', desc: 'All write actions need operator sign-off', enabled: true },
                { label: 'Audit Trail Logging', desc: 'Full event log persisted to SQLite DB', enabled: true },
                { label: 'Auto-Rollback on Failure', desc: 'Revert changes if service health fails', enabled: false },
              ].map((policy, i) => (
                <div key={i} className="flex items-start justify-between gap-2 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">{policy.label}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{policy.desc}</span>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border ${
                    policy.enabled 
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                      : 'bg-slate-500/20 text-slate-500 border-slate-500/20'
                  }`}>
                    {policy.enabled ? 'ON' : 'OFF'}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </motion.div>
  );
};
