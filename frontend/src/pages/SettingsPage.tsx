import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Building, GitBranch, Cpu, Users, Key, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.35 }}
      className="space-y-6 max-w-5xl mx-auto font-sans"
    >
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl theme-border border">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 text-xs font-semibold">
            Enterprise Configuration
          </span>
        </div>
        <h1 className="text-xl font-extrabold text-title mt-1">Organization & AI Settings</h1>
        <p className="text-xs text-subtitle mt-1">
          Manage workspace settings, OpenAI API models, connected GitHub repositories, team roles, and guardrail policies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Organization & AI Model Config */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Organization Details */}
          <div className="glass-panel p-6 rounded-2xl theme-border border space-y-4">
            <h2 className="text-xs font-bold text-title uppercase tracking-wider border-b theme-border pb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-500" />
              <span>Organization Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-subtitle font-medium block">Organization Name</label>
                <input
                  type="text"
                  disabled
                  value={user?.organizationName || 'Acme Operations Corp'}
                  className="w-full theme-input px-3 py-2.5 rounded-xl border theme-border font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-subtitle font-medium block">Organization Slug ID</label>
                <input
                  type="text"
                  disabled
                  value={user?.organizationId || 'org-acme-corp'}
                  className="w-full theme-input px-3 py-2.5 rounded-xl border theme-border text-subtitle font-mono"
                />
              </div>
            </div>
          </div>

          {/* OpenAI API Settings */}
          <div className="glass-panel p-6 rounded-2xl theme-border border space-y-4">
            <h2 className="text-xs font-bold text-title uppercase tracking-wider border-b theme-border pb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-500" />
              <span>OpenAI API Integration</span>
            </h2>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-subtitle font-medium block">Selected Reasoning Model</label>
                <select className="w-full theme-input px-3 py-2.5 rounded-xl border theme-border font-mono focus:outline-none focus:border-blue-500">
                  <option value="gpt-4o">gpt-4o (High-Precision Reasoning & Tool Calling)</option>
                  <option value="gpt-4o-mini">gpt-4o-mini (Fast Inspection)</option>
                  <option value="o1-mini">o1-mini (Deep Static Code Auditing)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-subtitle font-medium block">OpenAI API Key (Encrypted Storage)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    disabled
                    value="sk-proj-********************************"
                    className="flex-1 theme-input px-3 py-2.5 rounded-xl border theme-border font-mono"
                  />
                  <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 text-[10px] font-bold whitespace-nowrap">
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
          <div className="glass-panel p-6 rounded-2xl theme-border border space-y-3">
            <h2 className="text-xs font-bold text-title uppercase tracking-wider border-b theme-border pb-3 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-emerald-500" />
              <span>Connected Repository</span>
            </h2>

            <div className="text-xs space-y-2">
              <div className="flex items-center justify-between text-title font-mono card-bg-subtle p-2.5 rounded-xl border theme-border">
                <span>company/production-api</span>
                <span className="text-emerald-500 font-bold">Connected</span>
              </div>
              <p className="text-[11px] text-subtitle leading-relaxed">
                OpsPilot AI has Read/Write access to create pull requests, patch bug fixes, and run Docker compose commands.
              </p>
            </div>
          </div>

          {/* AI Guardrail Policies */}
          <div className="glass-panel p-6 rounded-2xl theme-border border space-y-3">
            <h2 className="text-xs font-bold text-title uppercase tracking-wider border-b theme-border pb-3 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              <span>AI Guardrail Policies</span>
            </h2>

            <div className="space-y-3 text-xs">
              {[
                { label: 'Human Approval Required', desc: 'All write actions need operator sign-off', enabled: true },
                { label: 'Audit Trail Logging', desc: 'Full event log persisted to SQLite DB', enabled: true },
                { label: 'Auto-Rollback on Failure', desc: 'Revert changes if service health fails', enabled: false },
              ].map((policy, i) => (
                <div key={i} className="flex items-start justify-between gap-2 p-2.5 card-bg-subtle rounded-xl border theme-border">
                  <div>
                    <span className="font-bold text-title block">{policy.label}</span>
                    <span className="text-[11px] text-subtitle">{policy.desc}</span>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border ${
                    policy.enabled 
                      ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' 
                      : 'bg-slate-500/20 text-subtitle border-slate-500/20'
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
