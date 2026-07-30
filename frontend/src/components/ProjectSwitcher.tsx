import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Server, Check, ShieldCheck, Terminal } from 'lucide-react';
import { Project } from '../types';

interface ProjectSwitcherProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (project: Project) => void;
  onOpenSetupModal: () => void;
}

export const ProjectSwitcher: React.FC<ProjectSwitcherProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onOpenSetupModal
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative font-sans w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800/90 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-800 transition shadow-xs group cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Server className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="truncate font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {activeProject?.name || 'Select Project'}
          </span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2.5 space-y-1.5 font-sans"
            >
              <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-200/80 dark:border-slate-800/80">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">
                  Active Projects ({projects.length})
                </span>
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  Zero-DB Vault
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                {projects.map(p => {
                  const isSelected = activeProject?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        onSelectProject(p);
                        setIsOpen(false);
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold shadow-md glow-blue'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-1.5 rounded-lg shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-blue-500'
                        }`}>
                          <Terminal className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <span className={`block truncate font-bold ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                            {p.name}
                          </span>
                          <span className={`text-[10px] font-mono block truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                            {p.serverHost ? `${p.serverUser || 'root'}@${p.serverHost}` : p.gitUrl ? 'GitHub AST Mode' : 'Local Sandbox Engine'}
                          </span>
                        </div>
                      </div>

                      {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                    </div>
                  );
                })}
              </div>

              <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenSetupModal();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Setup New Project</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
