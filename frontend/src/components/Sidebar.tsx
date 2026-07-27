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
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  Building
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
    { path: '/approvals', label: 'Approvals Queue', icon: CheckSquare, badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : undefined, badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold' },
    { path: '/reports', label: 'Post-Mortems', icon: FileText },
    { path: '/sandbox', label: 'Failure Injector', icon: Zap },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`sticky top-0 h-screen bg-[#080c14] border-r border-slate-800/80 flex flex-col justify-between transition-all duration-300 z-50 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      
      {/* Top Header Section */}
      <div className="p-4 space-y-5">
        
        {/* Brand Logo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-100 shrink-0">
              <Terminal className="w-4 h-4 text-blue-400" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="font-bold text-sm tracking-tight text-white block">
                  OpsPilot
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">DevOps Engine</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-900 transition"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Organization Card */}
        {!collapsed && user && (
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2.5">
            <div className="p-1 rounded bg-slate-800 text-slate-300">
              <Building className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-slate-200 block truncate">{user.organizationName}</span>
              <span className="text-[10px] text-slate-500 font-mono block">Production Workspace</span>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!collapsed && item.badge && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                    item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/80">
        {user && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user.name.charAt(0)}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-200 block truncate">{user.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono block">{user.role}</span>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-md transition"
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
