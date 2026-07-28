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
    { path: '/auditor', label: 'GitHub Auditor', icon: GitBranch, badge: `${scanScore}/100` },
    { path: '/command', label: 'Incident Command', icon: Terminal, badge: activeIncidentsCount > 0 ? `${activeIncidentsCount}` : undefined, badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { path: '/approvals', label: 'Approvals Queue', icon: CheckSquare, badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : undefined, badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40 glow-amber' },
    { path: '/runbooks', label: 'Auto Runbooks', icon: BookOpen },
    { path: '/audit-logs', label: 'Audit Logs', icon: ShieldCheck },
    { path: '/reports', label: 'Post-Mortems', icon: FileText },
    { path: '/sandbox', label: 'Failure Injector', icon: Zap },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`sticky top-0 h-screen sidebar-bg backdrop-blur-2xl border-r flex flex-col justify-between transition-all duration-300 z-50 ${
      collapsed ? 'w-20' : 'w-64'
    }`}>
      
      {/* Top Section */}
      <div className="p-4 space-y-5">
        
        {/* Brand Logo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
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

          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
            className="p-1.5 rounded-lg card-bg-subtle text-subtitle hover:text-title transition"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
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
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg glow-blue'
                      : 'text-subtitle hover:text-title card-bg-subtle'
                  }`
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!collapsed && item.badge && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                    item.badgeColor || 'card-bg-subtle text-subtitle'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Glass User Profile Footer */}
      <div className="p-3 border-t sidebar-bg">
        {user && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-md">
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
