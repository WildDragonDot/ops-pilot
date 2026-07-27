import React from 'react';
import { Settings, Building, GitBranch, Cpu, Users, Key, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
            Enterprise Configuration
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-white mt-1">Organization & AI Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage workspace settings, OpenAI API models, connected GitHub repositories, team roles, and guardrail policies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Organization & AI Model Config */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Organization Details */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400" />
              <span>Organization Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Organization Name</label>
                <input
                  type="text"
                  disabled
                  value={user?.organizationName || 'Acme Operations Corp'}
                  className="w-full bg-slate-950 px-3 py-2.5 rounded-xl border border-slate-800 text-slate-200 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Organization Slug ID</label>
                <input
                  type="text"
                  disabled
                  value={user?.organizationId || 'org-acme-corp'}
                  className="w-full bg-slate-950 px-3 py-2.5 rounded-xl border border-slate-800 text-slate-400 font-mono"
                />
              </div>
            </div>
          </div>

          {/* OpenAI API Settings */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>OpenAI API Integration</span>
            </h2>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Selected Reasoning Model</label>
                <select className="w-full bg-slate-950 px-3 py-2.5 rounded-xl border border-slate-800 text-slate-200 font-mono">
                  <option value="gpt-4o">gpt-4o (High-Precision Reasoning & Tool Calling)</option>
                  <option value="gpt-4o-mini">gpt-4o-mini (Fast Inspection)</option>
                  <option value="o1-mini">o1-mini (Deep Static Code Auditing)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">OpenAI API Key (Encrypted Storage)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    disabled
                    value="sk-proj-********************************"
                    className="flex-1 bg-slate-950 px-3 py-2.5 rounded-xl border border-slate-800 text-slate-400 font-mono"
                  />
                  <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
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
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-purple-400" />
              <span>Connected Repository</span>
            </h2>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
              <span className="font-bold text-blue-400 block">company/production-backend-api</span>
              <span className="text-[11px] text-slate-400 font-mono">Branch: main • Local Sync Active</span>
            </div>
          </div>

          {/* Workspace Team */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Team Members</span>
            </h2>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200 block">{user?.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{user?.email}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
