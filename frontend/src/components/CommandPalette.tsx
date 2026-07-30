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
      category: 'AI Chat',
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
      category: 'AI Chat',
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
      category: 'AI Chat',
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-in fade-in duration-200">
      <div className="max-w-xl w-full glass-panel rounded-2xl border theme-border shadow-2xl overflow-hidden space-y-2">
        
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b theme-border">
          <Search className="w-5 h-5 text-blue-500 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search action..."
            className="flex-1 bg-transparent text-xs text-title focus:outline-none font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500/50 placeholder:opacity-50"
          />
          <button onClick={onClose} aria-label="Close command palette" className="p-1 rounded-lg text-subtitle hover:text-title card-bg-subtle">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Actions List */}
        <div className="p-2 max-h-80 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-subtitle">No matching commands found</div>
          ) : (
            filtered.map((act) => {
              const Icon = act.icon;
              return (
                <div
                  key={act.id}
                  onClick={act.run}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-500/10 border border-transparent hover:border-blue-500/30 cursor-pointer group transition text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg card-bg-subtle text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-title block">{act.title}</span>
                      <span className="text-[10px] text-subtitle font-mono">{act.category}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-subtitle group-hover:text-blue-500 group-hover:translate-x-1 transition" />
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 py-2.5 card-bg-subtle border-t theme-border text-[10px] font-mono text-subtitle flex items-center justify-between">
          <span>Search or click command to execute</span>
          <span>Press <b>ESC</b> to exit</span>
        </div>

      </div>
    </div>
  );
};
