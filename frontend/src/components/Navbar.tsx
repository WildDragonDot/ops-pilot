import React from 'react';
import { 
  Activity, 
  Terminal, 
  CheckSquare, 
  FileText, 
  Radio, 
  GitBranch, 
  Zap,
  RefreshCw,
  Cpu,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { Project } from '../types';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  project: Project | null;
  onResetEnv: () => void;
  onScanRepo: () => void;
  isScanning: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  project,
  onResetEnv,
  onScanRepo,
  isScanning
}) => {
  const { user, logout } = useAuth();
  const status = project?.environmentStatus.overall || 'HEALTHY';
  
  const statusColor = 
    status === 'HEALTHY' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
    status === 'DEGRADED' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
    'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse';

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: Activity },
    { id: 'auditor', label: 'GitHub Auditor', icon: GitBranch },
    { id: 'command', label: 'Incident Command', icon: Terminal },
    { id: 'approvals', label: 'Approvals Queue', icon: CheckSquare },
    { id: 'reports', label: 'Post-Mortems', icon: FileText },
    { id: 'sandbox', label: 'Failure Injector', icon: Zap },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 border border-blue-500/40 rounded-lg flex items-center justify-center text-blue-400">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  OpsPilot AI
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest">
                  OpenAI Agent
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {user ? `${user.organizationName} • ${user.name}` : 'Production Commander'}
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border ${statusColor}`}>
              <Radio className="w-3.5 h-3.5 animate-ping" />
              <span className="font-bold">{status}</span>
            </div>

            <button
              onClick={onScanRepo}
              disabled={isScanning}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
            >
              <GitBranch className={`w-3.5 h-3.5 text-blue-400 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning...' : 'Scan Repo'}</span>
            </button>

            {user && (
              <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
                <button
                  onClick={logout}
                  title="Logout"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-lg text-xs font-medium transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
