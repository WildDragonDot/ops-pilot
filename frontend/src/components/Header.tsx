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
  Globe,
  Folder,
  Menu
} from 'lucide-react';
import { Project, Scan } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import { CommandPalette } from './CommandPalette';
import { ProjectSwitcher } from './ProjectSwitcher';
import { getProjectOperatingMode, getModeBadgeInfo } from '../utils/projectMode';
import { scanServerDirectoriesApi } from '../services/api';

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
  selectedTargetPath?: string;
  onSelectTargetPath?: (path: string) => void;
  onToggleMobileSidebar?: () => void;
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
  isScanning,
  selectedTargetPath = '',
  onSelectTargetPath = () => {},
  onToggleMobileSidebar = () => {}
}) => {
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState<boolean>(false);
  const [showStatusPopover, setShowStatusPopover] = useState<boolean>(false);
  const [showNotificationPopover, setShowNotificationPopover] = useState<boolean>(false);
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAllRead, markRead } = useNotification();

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

  const isLocalPath = (p?: string | null) => !p || p.startsWith('/Users/') || p.includes('Desktop') || p.startsWith('C:');
  const user = project?.serverUser || 'ec2-user';
  const repoName = project?.gitUrl ? project.gitUrl.split('/').pop()?.replace('.git', '') || 'app' : 'app';
  const defaultTargetPath = user === 'root' ? `/root/${repoName}` : `/home/${user}/${repoName}`;
  const targetPath = (selectedTargetPath && !isLocalPath(selectedTargetPath)) ? selectedTargetPath : (project?.rootPath && !isLocalPath(project.rootPath) ? project.rootPath : defaultTargetPath);

  const [serverDirectories, setServerDirectories] = useState<string[]>([
    defaultTargetPath,
    user === 'root' ? '/root' : `/home/${user}`,
    `/var/www/${repoName}`,
    `/opt/services/${repoName}`
  ]);

  React.useEffect(() => {
    const primaryPath = project?.rootPath && !isLocalPath(project.rootPath) ? project.rootPath : defaultTargetPath;
    const initialList = [
      primaryPath,
      user === 'root' ? '/root' : `/home/${user}`,
      defaultTargetPath,
      `/var/www/${repoName}`,
      `/opt/services/${repoName}`
    ].filter((v, i, a) => a.indexOf(v) === i);
    setServerDirectories(initialList);

    if (project?.serverHost) {
      scanServerDirectoriesApi({
        serverHost: project.serverHost,
        serverPort: project.serverPort || 22,
        serverUser: project.serverUser || 'root',
        baseDir: user === 'root' ? '/root' : `/home/${user}`
      }).then(res => {
        if (res?.success && res.directories && res.directories.length > 0) {
          const combined = Array.from(new Set([primaryPath, ...res.directories])).filter(d => !isLocalPath(d));
          setServerDirectories(combined);
          if (!selectedTargetPath || isLocalPath(selectedTargetPath)) {
            onSelectTargetPath?.(combined[0]);
          }
        }
      }).catch(() => {});
    }
  }, [project?.id, project?.serverHost, project?.serverUser, project?.gitUrl, project?.rootPath]);
  const [isEditingCustomPath, setIsEditingCustomPath] = useState<boolean>(false);
  const [customPathInput, setCustomPathInput] = useState<string>('');

  return (
    <>
      <header className="h-14 sm:h-16 header-bg backdrop-blur-xl border-b px-2 sm:px-5 lg:px-6 flex items-center justify-between sticky top-0 z-40 gap-1.5 sm:gap-3">
        
        {/* Left Section: Mobile Menu & Search Bar */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={onToggleMobileSidebar}
            aria-label="Toggle Mobile Navigation Menu"
            className="lg:hidden p-1.5 sm:p-2 rounded-lg card-bg-subtle border theme-border text-subtitle hover:text-title shrink-0 cursor-pointer"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
          </button>

          {/* Compact Mobile Search Icon */}
          <button 
            onClick={() => setCmdPaletteOpen(true)}
            aria-label="Open Command Palette Search"
            className="flex sm:hidden p-1.5 rounded-lg card-bg-subtle border theme-border text-subtitle hover:text-title cursor-pointer shrink-0"
            title="Search commands (⌘K)"
          >
            <Search className="w-4 h-4 text-blue-500" />
          </button>

          {/* Desktop & Tablet Search Bar */}
          <div 
            onClick={() => setCmdPaletteOpen(true)}
            className="hidden sm:flex items-center gap-2.5 bg-white/75 dark:bg-slate-950/75 px-3.5 py-2 rounded-lg border theme-border text-xs w-64 md:w-80 lg:w-96 hover:border-blue-500/50 transition cursor-pointer whitespace-nowrap shadow-xs group"
          >
            <Search className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform shrink-0" />
            <span className="flex-1 text-slate-600 dark:text-slate-400 font-mono text-xs truncate">
              Search commands, incidents and servers...
            </span>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] text-slate-500 dark:text-slate-400 border theme-border font-mono shrink-0 font-bold bg-white dark:bg-slate-950">⌘K</kbd>
          </div>
        </div>

        {/* Right Section: Target Path Selector, Status Pills & Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0 ml-auto min-w-0">
          
          {/* Target Path Dropdown Selector in Header (Shown ONLY when remote SSH host is active) */}
          {Boolean(project?.serverHost?.trim()) && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg card-bg-subtle border theme-border font-mono text-xs text-subtitle whitespace-nowrap shrink-0 shadow-xs">
              <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="font-semibold">Target:</span>
              {isEditingCustomPath ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={customPathInput}
                    onChange={(e) => setCustomPathInput(e.target.value)}
                    placeholder="/home/ubuntu/my-app"
                    className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-blue-500 text-blue-600 dark:text-blue-400 text-xs w-40 font-extrabold"
                  />
                  <button
                    onClick={() => {
                      if (customPathInput.trim()) {
                        const newPath = customPathInput.trim();
                        if (onSelectTargetPath) onSelectTargetPath(newPath);
                        if (!serverDirectories.includes(newPath)) {
                          setServerDirectories(prev => [newPath, ...prev]);
                        }
                        setIsEditingCustomPath(false);
                      }
                    }}
                    className="px-2 py-1 rounded bg-blue-600 text-white font-bold text-[10px] cursor-pointer"
                  >
                    Set
                  </button>
                  <button
                    onClick={() => setIsEditingCustomPath(false)}
                    className="text-slate-400 font-bold px-1"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <select
                  value={targetPath}
                  onChange={(e) => {
                    if (e.target.value === '__CUSTOM__') {
                      setCustomPathInput(targetPath);
                      setIsEditingCustomPath(true);
                    } else {
                      if (onSelectTargetPath) onSelectTargetPath(e.target.value);
                    }
                  }}
                  className="bg-transparent text-blue-600 dark:text-blue-400 font-extrabold font-mono text-xs cursor-pointer focus:outline-none border-none py-0 pr-1 max-w-[200px] lg:max-w-[280px] truncate"
                >
                  {serverDirectories.map((dir) => (
                    <option key={dir} value={dir} className="bg-slate-900 text-white font-mono">
                      {dir}
                    </option>
                  ))}
                  <option value="__CUSTOM__" className="bg-slate-900 text-blue-400 font-bold font-mono">
                    + Enter Custom Path...
                  </option>
                </select>
              )}
            </div>
          )}
          
          {/* Host Info Pill (only when SSH server is set) */}
          {mode !== 'SERVER_ONLY' && (
            <div className="hidden 2xl:flex items-center gap-2 px-3 py-2 rounded-lg card-bg-subtle border theme-border text-xs text-subtitle font-mono whitespace-nowrap shrink-0">
              <Server className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>Host: <b className="text-title font-bold">{project?.serverHost || 'Local Sandbox'}</b></span>
            </div>
          )}

          {/* Clickable System Status Pill with Popover */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowStatusPopover(!showStatusPopover)}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs font-mono border shadow-xs cursor-pointer transition hover:scale-[1.02] whitespace-nowrap shrink-0 max-w-[34vw] sm:max-w-none ${statusColor}`}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-700 dark:bg-emerald-400"></span>
              </span>
              <span className="font-mono font-extrabold uppercase text-[10px] sm:text-[11px] leading-none truncate max-w-[20vw] sm:max-w-none">{status}</span>
            </button>

            {/* Health Breakdown Popover */}
            {showStatusPopover && (
              <div 
                className="absolute right-0 mt-2 w-64 glass-panel border theme-border rounded-lg p-4 shadow-2xl z-50 animate-fadeIn"
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
                      <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg card-bg-subtle border theme-border">
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

          {/* Scan Repo Action Button (Hidden for SERVER_ONLY projects) */}
          {mode !== 'SERVER_ONLY' && (
            <button
              onClick={onScanRepo}
              disabled={isScanning}
              title="Scan Repository Codebase"
              className="w-8 h-8 sm:w-auto sm:px-3.5 sm:h-9 flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md glow-blue transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <GitBranch className={`w-4 h-4 shrink-0 ${isScanning ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline-block whitespace-nowrap">{isScanning ? 'Scanning...' : 'Scan Repo'}</span>
            </button>
          )}

          {/* Uniform Action Icon Buttons */}
          <button
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts (?)"
            aria-label="Open keyboard shortcuts guide"
            className="hidden sm:flex w-8 h-8 sm:w-9 sm:h-9 items-center justify-center text-subtitle hover:text-blue-500 card-bg-subtle rounded-xl border theme-border transition shrink-0 cursor-pointer"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-subtitle hover:text-amber-500 card-bg-subtle rounded-xl border theme-border transition shrink-0 cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
          </button>

          <button
            onClick={onResetEnv}
            title="Reset environment status"
            aria-label="Reset environment health status"
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-subtitle hover:text-emerald-500 card-bg-subtle rounded-xl border theme-border transition shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Notifications Toggle */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowNotificationPopover(!showNotificationPopover)}
              title="Notifications"
              aria-label="View notifications"
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-subtitle hover:text-title card-bg-subtle rounded-xl border theme-border transition relative shrink-0 cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              )}
            </button>
            
            {showNotificationPopover && (
              <div 
                className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto glass-panel border theme-border rounded-xl p-0 shadow-2xl z-50 animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-3 border-b theme-border bg-slate-50/50 dark:bg-slate-900/50 sticky top-0 backdrop-blur-md z-10">
                  <h4 className="text-xs font-bold text-title flex items-center gap-1.5 font-mono">
                    NOTIFICATIONS ({unreadCount})
                  </h4>
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => markAllRead()}
                      className="text-[10px] font-bold text-blue-500 hover:text-blue-600 cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="divide-y theme-border">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs font-mono">
                      No notifications
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => {
                          if (!n.read) markRead(n.id);
                        }}
                        className={`p-3 text-xs transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${n.read ? 'opacity-60' : 'bg-blue-50/30 dark:bg-blue-900/10'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <strong className="text-title leading-tight">{n.title}</strong>
                          {n.timestamp && <span className="text-[9px] text-slate-400 shrink-0">{n.timestamp}</span>}
                        </div>
                        <div className="text-subtitle mt-1 line-clamp-2 leading-relaxed">
                          {n.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

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
