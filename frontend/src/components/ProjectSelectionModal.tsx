import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Plus, Shield, ArrowRight, Terminal, Github, CheckCircle2, Sparkles } from 'lucide-react';
import { Project } from '../types';

interface ProjectSelectionModalProps {
  isOpen: boolean;
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (project: Project) => void;
  onOpenSetupModal: () => void;
  onClose?: () => void;
}

export const ProjectSelectionModal: React.FC<ProjectSelectionModalProps> = ({
  isOpen,
  projects,
  activeProject,
  onSelectProject,
  onOpenSetupModal,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white dark:bg-[#0d1117] w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden font-sans"
        >
          {/* Header Banner */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-[#0d1117] dark:via-[#161b22] dark:to-[#0d1117] flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold font-mono">
                  OpsPilot AI Workspaces
                </span>
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <Shield className="w-3 h-3 text-emerald-500" />
                  Zero-DB Security Vault
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Select Project to Launch Workspace</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose an active production project or connect a new server & GitHub repository.
              </p>
            </div>

            {onClose && activeProject && (
              <button
                onClick={onClose}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Close Window
              </button>
            )}
          </div>

          {/* Body Content: Projects List */}
          <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                Your Available Projects ({projects.length})
              </span>
              <button
                onClick={onOpenSetupModal}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Plus className="w-4 h-4" />
                <span>+ Setup New Project</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Setup New Project Action Card */}
              <div
                onClick={onOpenSetupModal}
                className="p-5 rounded-2xl border-2 border-dashed border-blue-500/30 hover:border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      + Setup New Project
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Connect real SSH server credentials & GitHub repository for automated incident auditing.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                  <span>Start 4-Step Setup Wizard</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Existing Projects List Cards */}
              {projects.map((p) => {
                const isSelected = activeProject?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectProject(p)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                      isSelected
                        ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-600 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-xl border ${
                            isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-blue-500 border-slate-200 dark:border-slate-700'
                          }`}>
                            <Terminal className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{p.name}</h3>
                            <span className="text-[10px] font-mono text-slate-400 block">{p.environmentType || 'Docker Compose'}</span>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1 font-mono">
                            <CheckCircle2 className="w-3 h-3" />
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-xs font-mono">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                          <span>SSH Server:</span>
                          <strong className="text-slate-800 dark:text-slate-200">
                            {p.serverHost ? `${p.serverUser || 'root'}@${p.serverHost}:${p.serverPort || 22}` : 'Local Sandbox Engine'}
                          </strong>
                        </div>
                        {p.gitUrl && (
                          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                            <span>GitHub:</span>
                            <strong className="text-blue-600 dark:text-blue-400 truncate max-w-[170px]">{p.gitUrl}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        Client Vault Secure
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProject(p);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
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
          </div>

          {/* Footer Note */}
          <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>OpsPilot AI multi-project routing engine active</span>
            </span>
            <span className="font-mono text-[10px]">Zero-DB Encrypted Storage</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
