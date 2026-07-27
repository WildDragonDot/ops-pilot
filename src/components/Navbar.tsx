import React from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Terminal, 
  CheckSquare, 
  FileText, 
  Radio, 
  GitBranch, 
  Zap,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { Project } from '../types';

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
          
          {/* Logo & Product Brand */}
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
                  Senior Agent
                </span>
              </div>
              <p className="text-xs text-slate-400">Production Incidents & GitHub Auditor</p>
            </div>
          </div>

          {/* Navigation Links */}
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

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            
            {/* Environment Status Badge */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border ${statusColor}`}>
              <Radio className="w-3.5 h-3.5 animate-ping" />
              <span className="font-bold">{status}</span>
            </div>

            {/* Quick Trigger Buttons */}
            <button
              onClick={onScanRepo}
              disabled={isScanning}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
            >
              <GitBranch className={`w-3.5 h-3.5 text-blue-400 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning...' : 'Scan Repo'}</span>
            </button>

            <button
              onClick={onResetEnv}
              title="Reset environment health"
              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition border border-transparent hover:border-slate-700"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
