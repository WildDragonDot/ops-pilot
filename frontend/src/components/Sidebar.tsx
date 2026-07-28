import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Activity, 
  GitBranch, 
  Terminal, 
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
import { Incident } from '../types';

interface SidebarProps {
  incidents: Incident[];
  scanScore?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ incidents, scanScore = 78 }) => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const pendingApprovalsCount = incidents.filter(i => i.status === 'AWAITING_APPROVAL').length;
  const activeIncidentsCount = incidents.filter(i => i.status === 'INVESTIGATING' || i.status === 'AWAITING_APPROVAL').length;

  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: Activity },
    { path: '/auditor', label: 'GitHub Auditor', icon: GitBranch, badge: `${scanScore}/100`, badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-extrabold' },
    { path: '/command', label: 'Incident Command', icon: Terminal, badge: activeIncidentsCount > 0 ? `${activeIncidentsCount}` : undefined, badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-extrabold' },
    { path: '/approvals', label: 'Approvals Queue', icon: CheckSquare, badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : undefined, badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-extrabold' },
    { path: '/runbooks', label: 'Auto Runbooks', icon: BookOpen },
    { path: '/audit-logs', label: 'Audit Logs', icon: ShieldCheck },
    { path: '/reports', label: 'Post-Mortems', icon: FileText },
    { path: '/sandbox', label: 'Failure Injector', icon: Zap },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`sticky top-0 h-screen sidebar-bg backdrop-blur-2xl border-r flex flex-col justify-between transition-all duration-300 z-50 relative ${
      collapsed ? 'w-20' : 'w-64'
    }`}>
      
      {/* Floating Expand/Collapse Toggle Button on Sidebar Border */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full card-bg-subtle border theme-border shadow-md text-title hover:bg-blue-600 hover:text-white hover:scale-110 flex items-center justify-center transition z-50 cursor-pointer"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" /> : <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />}
      </button>

      {/* Top Section */}
      <div className={`space-y-5 ${collapsed ? 'px-2 py-4' : 'p-4'}`}>
        
        {/* Brand Logo */}
        <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'gap-3'}`}>
          <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg glow-blue shrink-0 flex items-center justify-center">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-title">
                  OpsPilot
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-500 border border-blue-500/30">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-subtitle font-mono">DevOps Agent</p>
            </div>
          )}
        </div>

        {/* Organization Glass Card */}
        {!collapsed && user && (
          <div className="glass-panel p-3 rounded-xl flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
              <Building className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-title block truncate">{user.organizationName}</span>
              <span className="text-[10px] text-subtitle font-mono block">Production Org</span>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center ${collapsed ? 'justify-center px-2 py-3' : 'justify-between px-3 py-2.5'} rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'text-subtitle hover:text-title hover:bg-slate-500/10'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`flex items-center ${collapsed ? 'justify-center relative' : 'gap-3 min-w-0'}`}>
                      <Icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      
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
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-md" title={user.name}>
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
                className="p-2 text-subtitle hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
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
