import React, { useState } from 'react';
import { 
  Search, 
  GitBranch, 
  RefreshCw, 
  Bell, 
  Server,
  Sun,
  Moon,
  Keyboard,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  Layers,
  Globe
} from 'lucide-react';
import { Project, Scan } from '../types';
import { useTheme } from '../context/ThemeContext';
import { CommandPalette } from './CommandPalette';
import { ProjectSwitcher } from './ProjectSwitcher';
import { getProjectOperatingMode, getModeBadgeInfo } from '../utils/projectMode';

interface HeaderProps {
  project: Project | null;
  projects?: Project[];
  scan?: Scan | null;
  onSelectProject?: (project: Project) => void;
  onOpenSetupModal?: () => void;
  onOpenShortcuts?: () => void;
  onResetEnv: () => void;
  onScanRepo: () => void;
  isScanning: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  projects = [],
  scan,
  onSelectProject = () => {},
  onOpenSetupModal = () => {},
  onOpenShortcuts = () => {},
  onResetEnv,
  onScanRepo,
  isScanning
}) => {
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState<boolean>(false);
  const [showStatusPopover, setShowStatusPopover] = useState<boolean>(false);
  const { theme, toggleTheme } = useTheme();

  let savedResolved: string[] = [];
  try {
    const raw = localStorage.getItem('opspilot_resolved_patches');
    if (raw) savedResolved = JSON.parse(raw);
  } catch {}

  const findings = scan?.findings || [];
  const unresolvedCount = findings.filter(f => {
    if ((f as any).status === 'RESOLVED') return false;
    if (savedResolved.includes(f.id) || savedResolved.includes(f.title)) return false;
    if (f.filePath && savedResolved.includes(f.filePath)) return false;
    const baseKey = f.id.split('-').slice(-2).join('-');
    return !savedResolved.some(id => id.includes(baseKey));
  }).length;

  const mode = getProjectOperatingMode(project);
  const modeBadge = getModeBadgeInfo(mode);
  const rawEnv = project?.environmentStatus;
  const allNodesHealthy = rawEnv && rawEnv.postgres === 'RUNNING' && rawEnv.redis === 'RUNNING' && rawEnv.api === 'RUNNING' && rawEnv.nginx === 'HEALTHY';

  let status = 'HEALTHY';
  let statusColor = 'status-healthy glow-emerald';

  if (mode === 'HYBRID_BOTH') {
    if (unresolvedCount > 0) {
      status = `${unresolvedCount} CODE RISKS DETECTED`;
      statusColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 glow-amber font-extrabold';
    } else if (!allNodesHealthy) {
      status = 'INFRA DEGRADED';
      statusColor = 'status-warning glow-amber font-extrabold';
    } else {
      status = 'HYBRID HEALTHY (100%)';
      statusColor = 'status-healthy glow-emerald font-extrabold';
    }
  } else if (mode === 'GITHUB_ONLY') {
    if (unresolvedCount > 0) {
      status = 'RISKS DETECTED';
      statusColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 glow-amber font-extrabold';
    } else {
      status = 'REPO PROTECTED';
      statusColor = 'status-healthy glow-emerald font-extrabold';
    }
  } else if (mode === 'SERVER_ONLY') {
    status = allNodesHealthy ? 'CLUSTER HEALTHY' : (rawEnv?.overall || 'CLUSTER DEGRADED');
    statusColor = allNodesHealthy ? 'status-healthy glow-emerald' : 'status-warning glow-amber';
  } else {
    status = 'LOCAL SANDBOX';
    statusColor = 'card-bg-subtle text-title border theme-border font-mono';
  }

  const nodes = [
    { name: 'PostgreSQL DB', port: 5432, state: rawEnv?.postgres || 'RUNNING', icon: Database },
    { name: 'Redis Cache', port: 6379, state: rawEnv?.redis || 'RUNNING', icon: Layers },
    { name: 'API Gateway', port: 5080, state: rawEnv?.api || 'RUNNING', icon: Server },
    { name: 'Nginx Proxy', port: 80, state: rawEnv?.nginx || 'HEALTHY', icon: Globe },
  ];

  return (
    <>
      <header className="h-16 header-bg backdrop-blur-xl border-b px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 gap-3">
        
        {/* Left Section: Project Switcher + Search Bar */}
        <div className="flex items-center gap-3 shrink-0">
          <ProjectSwitcher
            projects={projects}
            activeProject={project}
            onSelectProject={onSelectProject}
            onOpenSetupModal={onOpenSetupModal}
          />

          {/* Search Bar - Fixed width, no flex grow collision */}
          <div 
            onClick={() => setCmdPaletteOpen(true)}
            className="hidden md:flex items-center gap-2 card-bg-subtle px-3 py-1.5 rounded-xl border theme-border text-xs w-48 lg:w-60 xl:w-64 hover:border-blue-500/50 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <Search className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="flex-1 text-subtitle font-mono text-[11px] truncate">
              Search commands (⌘K)...
            </span>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] text-subtitle border theme-border font-mono shrink-0">⌘K</kbd>
          </div>
        </div>

        {/* Right Section: Status Pills & Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-auto">
          
          {/* Host Info Pill (only on large screens 2xl) */}
          <div className="hidden 2xl:flex items-center gap-2 px-3 py-1.5 rounded-xl card-bg-subtle border theme-border text-xs text-subtitle font-mono whitespace-nowrap shrink-0">
            <Server className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>Host: <b className="text-title font-bold">{project?.serverHost || 'Local Sandbox'}</b></span>
          </div>

          {/* Clickable System Status Pill with Popover */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowStatusPopover(!showStatusPopover)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border shadow-xs cursor-pointer transition hover:scale-105 whitespace-nowrap shrink-0 ${statusColor}`}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-700 dark:bg-emerald-400"></span>
              </span>
              <span className="font-mono font-extrabold uppercase tracking-wider text-[11px] leading-none">{status}</span>
            </button>

            {/* Health Breakdown Popover */}
            {showStatusPopover && (
              <div 
                className="absolute right-0 mt-2 w-64 glass-panel border theme-border rounded-2xl p-4 shadow-2xl z-50 animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-3 border-b theme-border mb-3">
                  <h4 className="text-xs font-bold text-title flex items-center gap-1.5 font-mono uppercase tracking-wider">
                    Node Health Matrix
                  </h4>
                  <button 
                    onClick={onResetEnv}
                    title="Reset node statuses"
                    className="p-1 hover:bg-slate-500/10 rounded-md text-subtitle text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3 text-blue-500" /> Reset
                  </button>
                </div>

                <div className="space-y-2">
                  {nodes.map((n, idx) => {
                    const NIcon = n.icon;
                    const isOk = n.state === 'RUNNING' || n.state === 'HEALTHY';
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl card-bg-subtle border theme-border">
                        <div className="flex items-center gap-2">
                          <NIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <div>
                            <div className="font-semibold text-title text-[11px]">{n.name}</div>
                            <div className="text-[10px] text-subtitle font-mono">Port {n.port}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {isOk ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (n.state as string) === 'DEGRADED' ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500 animate-pulse shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Scan Repo Action Button */}
          <button
            onClick={onScanRepo}
            disabled={isScanning}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md glow-blue transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <GitBranch className={`w-3.5 h-3.5 shrink-0 ${isScanning ? 'animate-spin' : ''}`} />
            <span className="inline-block whitespace-nowrap">{isScanning ? 'Scanning...' : 'Scan Repo'}</span>
          </button>

          {/* Uniform Action Icon Buttons */}
          <button
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts (?)"
            aria-label="Open keyboard shortcuts guide"
            className="w-9 h-9 flex items-center justify-center text-subtitle hover:text-blue-500 card-bg-subtle rounded-xl border theme-border transition shrink-0 cursor-pointer"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
            className="w-9 h-9 flex items-center justify-center text-subtitle hover:text-amber-500 card-bg-subtle rounded-xl border theme-border transition shrink-0 cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
          </button>

          <button
            onClick={onResetEnv}
            title="Reset environment status"
            aria-label="Reset environment health status"
            className="w-9 h-9 flex items-center justify-center text-subtitle hover:text-emerald-500 card-bg-subtle rounded-xl border theme-border transition shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCmdPaletteOpen(true)}
            title="Alerts"
            aria-label="View system alerts and command palette"
            className="w-9 h-9 flex items-center justify-center text-subtitle hover:text-title card-bg-subtle rounded-xl border theme-border transition relative shrink-0 cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
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
