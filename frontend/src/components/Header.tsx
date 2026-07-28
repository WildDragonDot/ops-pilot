import React, { useState } from 'react';
import { 
  Search, 
  Radio, 
  GitBranch, 
  RefreshCw, 
  Bell, 
  Server,
  Sun,
  Moon
} from 'lucide-react';
import { Project } from '../types';
import { useTheme } from '../context/ThemeContext';
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
  const { theme, toggleTheme } = useTheme();
  const status = project?.environmentStatus.overall || 'HEALTHY';

  const statusColor = 
    status === 'HEALTHY' ? 'status-healthy glow-emerald' :
    status === 'DEGRADED' ? 'status-warning glow-amber' :
    'status-danger glow-rose animate-pulse';

  return (
    <>
      <header className="h-16 header-bg backdrop-blur-xl border-b px-6 flex items-center justify-between sticky top-0 z-40">
        
        {/* Search Bar / Command Palette Launcher */}
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div 
            onClick={() => setCmdPaletteOpen(true)}
            className="flex items-center gap-2 card-bg-subtle px-3.5 py-2 rounded-xl border theme-border text-xs w-full hover:border-blue-500/50 transition cursor-pointer"
          >
            <Search className="w-4 h-4 text-blue-500" />
            <span className="flex-1 text-subtitle font-mono text-xs truncate">
              Search commands or inspect cluster (Ctrl + K)...
            </span>
            <kbd className="px-2 py-0.5 rounded-md card-bg-subtle text-[10px] text-subtitle border font-mono">⌘K</kbd>
          </div>
        </div>

        {/* Right Status & Quick Action Pills */}
        <div className="flex items-center gap-3">
          
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl card-bg-subtle border text-xs text-subtitle font-mono">
            <Server className="w-3.5 h-3.5 text-blue-500" />
            <span>Cluster: <b className="text-title">Local Docker</b></span>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border shadow-sm ${statusColor}`}>
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-700 dark:bg-emerald-400"></span>
            </span>
            <span className="font-mono font-extrabold uppercase tracking-wider text-[11px]">{status}</span>
          </div>

          <button
            onClick={onScanRepo}
            disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg glow-blue transition"
          >
            <GitBranch className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isScanning ? 'Scanning...' : 'Scan Repo'}</span>
          </button>

          {/* Dark / Light Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
            className="p-2 text-subtitle hover:text-amber-500 card-bg-subtle rounded-xl border transition"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
          </button>

          <button
            onClick={onResetEnv}
            title="Reset environment status"
            aria-label="Reset environment health status"
            className="p-2 text-subtitle hover:text-emerald-500 card-bg-subtle rounded-xl border transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCmdPaletteOpen(true)}
            title="Alerts"
            aria-label="View system alerts and command palette"
            className="p-2 text-subtitle hover:text-title card-bg-subtle rounded-xl border transition relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
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
