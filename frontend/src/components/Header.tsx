import React, { useState } from 'react';
import { 
  Search, 
  Radio, 
  GitBranch, 
  RefreshCw, 
  Bell, 
  Server
} from 'lucide-react';
import { Project } from '../types';
import { CommandPalette } from './CommandPalette';

interface HeaderProps {
  project: Project | null;
  onResetEnv: () => void;
  onScanRepo: () => void;
  isScanning: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  onResetEnv,
  onScanRepo,
  isScanning
}) => {
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState<boolean>(false);
  const status = project?.environmentStatus.overall || 'HEALTHY';

  const statusColor = 
    status === 'HEALTHY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
    status === 'DEGRADED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
    'bg-rose-500/10 text-rose-400 border-rose-500/30';

  return (
    <>
      <header className="h-14 bg-[#080c14]/90 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-40">
        
        {/* Left Search Bar / Command Palette Launcher */}
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div 
            onClick={() => setCmdPaletteOpen(true)}
            className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs w-full hover:border-slate-700 transition cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="flex-1 text-slate-400 font-mono text-xs truncate">
              Search commands or inspect cluster (Ctrl + K)...
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700 font-mono">⌘K</kbd>
          </div>
        </div>

        {/* Right Status & Quick Action Pills */}
        <div className="flex items-center gap-3">
          
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono">
            <Server className="w-3.5 h-3.5 text-blue-400" />
            <span>Cluster: <b className="text-slate-200">Local Docker</b></span>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border ${statusColor}`}>
            <Radio className="w-3 h-3 text-emerald-400" />
            <span className="font-semibold">{status}</span>
          </div>

          <button
            onClick={onScanRepo}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <GitBranch className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isScanning ? 'Scanning...' : 'Scan Repo'}</span>
          </button>

          <button
            onClick={onResetEnv}
            title="Reset environment status"
            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-900 rounded-lg border border-slate-800 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setCmdPaletteOpen(true)}
            title="Alerts"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg border border-slate-800 transition"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>

        </div>
      </header>

      <CommandPalette
        isOpen={cmdPaletteOpen}
        onClose={() => setCmdPaletteOpen(false)}
        onScanRepo={onScanRepo}
        onInjectFailure={() => {}}
      />
    </>
  );
};
