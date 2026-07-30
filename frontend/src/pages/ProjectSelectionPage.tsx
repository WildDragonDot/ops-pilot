import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Server, Plus, Shield, ArrowRight, Terminal, CheckCircle2, Search, Trash2, Cpu, LogOut, Sun, Moon, Calendar, Clock, Radio } from 'lucide-react';
import { Project } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { removeProject } from '../services/api';

interface ProjectSelectionPageProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (project: Project) => void;
  onOpenSetupModal: () => void;
  onProjectDeleted?: (id: string) => void;
}

export const ProjectSelectionPage: React.FC<ProjectSelectionPageProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onOpenSetupModal,
  onProjectDeleted
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.serverHost && p.serverHost.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.gitUrl && p.gitUrl.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this project configuration?')) {
      try {
        await removeProject(id);
        if (onProjectDeleted) onProjectDeleted(id);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Jul 28, 2026';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return 'Jul 28, 2026';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 font-sans flex flex-col">
      
      {/* Standalone Landing Top Header */}
      <header className="h-16 bg-white dark:bg-[#0d1117] border-b border-slate-200 dark:border-slate-800 px-6 sm:px-10 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-500 flex items-center justify-center">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100">
                D-OpsPilot AI
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase tracking-widest">
                DevOps Agent
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              {user ? `${user.organizationName || 'Production Org'} • ${user.name}` : 'Autonomous Incident Commander'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
          </button>

          {/* Logout Button */}
          {user && (
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Page Body Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-8 space-y-6">
        
        {/* Main Banner */}
        <div className="bg-white dark:bg-[#0d1117] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-xs font-bold font-mono">
                D-OpsPilot AI Workspaces
              </span>
              <span className="flex items-center gap-1 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                Zero-DB Storage Security
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Select Work Project & Server Environment
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Welcome back, <strong className="text-slate-800 dark:text-slate-200">{user?.name || 'Operator'}</strong>! Select your target project below to launch the AI Incident Command workspace or connect a new server.
            </p>
          </div>

          <button
            onClick={onOpenSetupModal}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md glow-blue transition shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Setup New Project</span>
          </button>
        </div>

        {/* Search & Counter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0d1117] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search projects by name, host IP, or repository..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-500 dark:text-slate-400">
            <span>Active Projects: <strong className="text-slate-900 dark:text-slate-100">{projects.length}</strong></span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Client Vault Active</span>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Setup New Project Card */}
          <div
            onClick={onOpenSetupModal}
            className="p-6 rounded-2xl border-2 border-dashed border-blue-500/30 hover:border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 transition-all cursor-pointer flex flex-col justify-between min-h-[240px] group shadow-card shadow-card-hover"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  + Setup New Project
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Connect real SSH server credentials & GitHub repository for automated incident auditing.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-600 dark:text-blue-400 pt-3 border-t border-blue-500/10">
              <span>Start 4-Step Setup Wizard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Existing Projects Cards */}
          {filteredProjects.map((p) => {
            const isSelected = activeProject?.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => onSelectProject(p)}
                className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[240px] space-y-4 shadow-card shadow-card-hover ${
                  isSelected
                    ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-600 ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2.5 rounded-xl border ${
                        isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-blue-500 border-slate-200 dark:border-slate-700'
                      }`}>
                        <Terminal className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{p.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {p.environmentType || 'Docker Compose'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDelete(e, p.id)}
                      title="Remove Project"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Server Connection Status Pill */}
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-bold">
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span>{p.serverHost && p.gitUrl ? 'HYBRID CONNECTED' : p.serverHost ? 'SSH SERVER CONNECTED' : p.gitUrl ? 'GITHUB AST MODE' : 'LOCAL ENGINE ONLINE'}</span>
                    </div>
                    <span className="text-[9px] opacity-80">{p.serverHost ? `PORT ${p.serverPort || 22}` : p.gitUrl ? 'REPO' : 'SANDBOX'}</span>
                  </div>

                  {/* Server & GitHub Config */}
                  <div className="space-y-1 text-xs font-mono bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                      <span>SSH Host:</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {p.serverHost ? `${p.serverUser || 'root'}@${p.serverHost}` : p.gitUrl ? 'Not attached (GitHub-only)' : 'Local Sandbox Engine'}
                      </strong>
                    </div>
                    {p.gitUrl && (
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                        <span>GitHub:</span>
                        <strong className="text-blue-600 dark:text-blue-400 truncate max-w-[140px]">{p.gitUrl}</strong>
                      </div>
                    )}
                  </div>

                  {/* Small Created & Updated Dates */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Created: {formatDate(p.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Updated: {formatDate(p.updatedAt)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Vault Encrypted
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProject(p);
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>Launch Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
        D-OpsPilot AI — Autonomous Incident Commander & Zero-DB Security Architecture
      </footer>

    </div>
  );
};
