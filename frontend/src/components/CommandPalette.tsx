import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Terminal, 
  GitBranch, 
  CheckSquare, 
  FileText, 
  Zap, 
  Settings, 
  Activity, 
  X,
  ArrowRight
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onScanRepo: () => void;
  onInjectFailure: (scenarioKey: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onScanRepo,
  onInjectFailure
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'cmd-investigate-502',
      title: 'Investigate 502 Bad Gateway Outage',
      category: 'Incident Command',
      icon: Terminal,
      run: () => {
        onInjectFailure('DATABASE_STOPPED');
        navigate('/command');
        onClose();
      }
    },
    {
      id: 'cmd-investigate-config',
      title: 'Investigate DATABASE_URL Config Mismatch',
      category: 'Incident Command',
      icon: Zap,
      run: () => {
        onInjectFailure('CONFIG_MISMATCH');
        navigate('/command');
        onClose();
      }
    },
    {
      id: 'cmd-investigate-codebug',
      title: 'Investigate Login API 500 Code Bug',
      category: 'Incident Command',
      icon: Zap,
      run: () => {
        onInjectFailure('CODE_BUG');
        navigate('/command');
        onClose();
      }
    },
    {
      id: 'cmd-scan-repo',
      title: 'Run AI GitHub Repository Audit',
      category: 'GitHub Auditor',
      icon: GitBranch,
      run: () => {
        onScanRepo();
        navigate('/auditor');
        onClose();
      }
    },
    {
      id: 'cmd-view-approvals',
      title: 'View Pending Approval Queue',
      category: 'Navigation',
      icon: CheckSquare,
      run: () => {
        navigate('/approvals');
        onClose();
      }
    },
    {
      id: 'cmd-view-reports',
      title: 'Open Incident Post-Mortem Reports',
      category: 'Navigation',
      icon: FileText,
      run: () => {
        navigate('/reports');
        onClose();
      }
    },
    {
      id: 'cmd-view-settings',
      title: 'Open Organization & AI Settings',
      category: 'Navigation',
      icon: Settings,
      run: () => {
        navigate('/settings');
        onClose();
      }
    }
  ];

  const filtered = query.trim() === '' 
    ? actions 
    : actions.filter(a => a.title.toLowerCase().includes(query.toLowerCase()) || a.category.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-in fade-in duration-200">
      <div className="max-w-xl w-full glass-panel rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden bg-slate-950/95 space-y-2">
        
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
          <Search className="w-5 h-5 text-blue-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search action..."
            className="flex-1 bg-transparent text-sm text-slate-100 focus:outline-none font-mono placeholder:text-slate-500"
          />
          <button onClick={onClose} className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Actions List */}
        <div className="p-2 max-h-80 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">No matching commands found</div>
          ) : (
            filtered.map((act) => {
              const Icon = act.icon;
              return (
                <div
                  key={act.id}
                  onClick={act.run}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-900/90 border border-transparent hover:border-slate-800 cursor-pointer group transition text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-900 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-200 block group-hover:text-white">{act.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{act.category}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition" />
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 bg-slate-900/80 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 flex items-center justify-between">
          <span>Use <b>↑ ↓</b> to navigate, <b>↵</b> to execute</span>
          <span>Press <b>ESC</b> to exit</span>
        </div>

      </div>
    </div>
  );
};
