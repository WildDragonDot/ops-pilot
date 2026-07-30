import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Activity, 
  GitBranch, 
  Terminal, 
  TerminalSquare,
  CheckSquare, 
  FileText, 
  Zap, 
  Settings, 
  BookOpen,
  ShieldCheck,
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  Building,
  Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Incident, Project } from '../types';
import { getProjectOperatingMode, getModeBadgeInfo } from '../utils/projectMode';
import { ProjectSwitcher } from './ProjectSwitcher';

interface SidebarProps {
  incidents: Incident[];
  scanScore?: number;
  project?: Project | null;
  projects?: Project[];
  onSelectProject?: (project: Project) => void;
  onOpenSetupModal?: () => void;
  onOpenTerminal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  incidents, 
  scanScore, 
  project, 
  projects = [], 
  onSelectProject = () => {}, 
  onOpenSetupModal = () => {},
  onOpenTerminal = () => {}
}) => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const pendingApprovalsCount = incidents.filter(i => i.status === 'AWAITING_APPROVAL').length;
  const activeIncidentsCount = incidents.filter(i => i.status === 'INVESTIGATING' || i.status === 'AWAITING_APPROVAL').length;
  
  const mode = getProjectOperatingMode(project);
  const modeBadge = getModeBadgeInfo(mode);
  const isServerOnly = mode === 'SERVER_ONLY';
  const hasServer = Boolean(project?.serverHost?.trim());

  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: Activity },
    ...(!isServerOnly ? [{ path: '/auditor', label: 'GitHub Auditor', icon: GitBranch, badge: scanScore ? `${scanScore}/100` : 'READY', badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-extrabold' }] : []),
    ...(hasServer ? [{ path: '__ssh_terminal__', label: 'SSH Terminal', icon: TerminalSquare, action: onOpenTerminal, special: true }] : []),
    { path: '/command', label: 'AI Chat', icon: Terminal, badge: activeIncidentsCount > 0 ? `${activeIncidentsCount}` : undefined, badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-extrabold' },
    { path: '/approvals', label: 'Approvals Queue', icon: CheckSquare, badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : undefined, badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-extrabold' },
    { path: '/runbooks', label: 'Auto Runbooks', icon: BookOpen },
    { path: '/audit-logs', label: 'Audit Logs', icon: ShieldCheck },
    { path: '/reports', label: 'Post-Mortems', icon: FileText },
    { path: '/sandbox', label: 'Failure Injector', icon: Zap, badge: !isServerOnly ? undefined : undefined, badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px]' },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`sticky top-0 h-screen sidebar-bg backdrop-blur-2xl border-r flex flex-col justify-between transition-all duration-300 z-50 relative shrink-0 ${
      collapsed ? 'w-20' : 'w-64'
    }`}>
      
      {/* Floating Expand/Collapse Toggle Button on Sidebar Border */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full card-bg-subtle border theme-border shadow-md text-title hover:bg-blue-600 hover:text-white hover:scale-105 flex items-center justify-center transition z-50 cursor-pointer"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" /> : <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />}
      </button>

      {/* Top Section */}
      <div className={`space-y-4 ${collapsed ? 'px-2 py-4' : 'p-4'}`}>
        
        {/* Brand Logo */}
        <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'gap-3'}`}>
          <div className="p-2.5 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-lg text-white shadow-lg glow-blue shrink-0 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-title">
                  D-OpsPilot
                </span>
                <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/20">
                  AI
                </span>
              </div>
              <div className="mt-1">
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-extrabold border block truncate text-center ${modeBadge.color}`}>
                  {modeBadge.label}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Active Project / Server Switcher Dropdown in Sidebar */}
        {!collapsed && (
          <div className="my-1">
            <ProjectSwitcher
              projects={projects}
              activeProject={project || null}
              onSelectProject={onSelectProject}
              onOpenSetupModal={onOpenSetupModal}
            />
          </div>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.action) {
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={item.action}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center transition-all w-full ${
                    collapsed 
                      ? 'justify-center w-11 h-11 mx-auto my-1 rounded-lg' 
                      : 'justify-between px-3 py-2.5 rounded-lg'
                    } text-xs font-semibold text-subtitle hover:text-title hover:bg-slate-500/10 border border-transparent cursor-pointer`}
                >
                  <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="truncate leading-none">{item.label}</span>}
                  </div>
                </button>
              );
            }
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center transition-all ${
                    collapsed 
                      ? 'justify-center w-11 h-11 mx-auto my-1 rounded-lg' 
                      : 'justify-between px-3 py-2.5 rounded-lg'
                    } text-xs font-semibold ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-subtitle hover:text-title hover:bg-slate-500/10'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`flex items-center ${collapsed ? 'justify-center relative' : 'gap-3 min-w-0'}`}>
                      <Icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate leading-none">{item.label}</span>}
                      
                      {/* Collapsed Notification Dot Badge */}
                      {collapsed && item.badge && !item.badge.includes('/') && (
                        <span className={`absolute -top-2 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold font-mono border shadow-sm ${
                          isActive
                            ? 'bg-white text-blue-700 border-white font-extrabold'
                            : (item.path === '/approvals' ? 'bg-amber-500 text-white border-amber-600 font-extrabold' : 'bg-blue-600 text-white border-blue-700 font-extrabold')
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>

                    {/* Expanded Sidebar Badge Pill */}
                    {!collapsed && item.badge && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold border transition-all ${
                        isActive
                          ? 'bg-white/25 text-white border-white/40 shadow-sm'
                          : (item.badgeColor || 'card-bg-subtle text-subtitle')
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Glass User Profile Footer */}
      <div className="p-3 border-t sidebar-bg">
        {user && (
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-2`}>
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
              <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-md shadow-emerald-600/25 mx-auto" title={user.name}>
                {user.name.charAt(0)}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <span className="text-xs font-bold text-title block truncate">{user.name}</span>
                  <span className="text-[10px] text-subtitle font-mono block">{user.role}</span>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                onClick={logout}
                title="Logout"
                aria-label="Log out of session"
                className="p-2 text-subtitle hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

    </aside>
  );
};
