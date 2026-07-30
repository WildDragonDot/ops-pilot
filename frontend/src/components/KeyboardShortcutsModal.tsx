import React, { useEffect } from 'react';
import { Command, X, Search, GitBranch, Moon, Home, Terminal, ShieldAlert, Cpu, Sparkles, BookOpen } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
  onScanRepo?: () => void;
  onToggleTheme?: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onNavigate = () => {},
  onScanRepo = () => {},
  onToggleTheme = () => {}
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: 'Global Controls',
      items: [
        { key: '⌘ K', label: 'Open Command Palette', icon: Search },
        { key: '⌘ /  or  ?', label: 'Toggle Keyboard Shortcuts Modal', icon: Command },
        { key: '⌘ T', label: 'Toggle Light / Dark Theme', icon: Moon, action: onToggleTheme },
        { key: '⌘ S', label: 'Trigger AI Repo Security Scan', icon: GitBranch, action: onScanRepo },
      ]
    },
    {
      title: 'Workspace Navigation',
      items: [
        { key: '⌘ 1', label: 'Project Selector', icon: Home, action: () => onNavigate('/projects') },
        { key: '⌘ 2', label: 'System Overview Dashboard', icon: Cpu, action: () => onNavigate('/dashboard') },
        { key: '⌘ 3', label: 'Repository Auditor', icon: ShieldAlert, action: () => onNavigate('/auditor') },
        { key: '⌘ 4', label: 'AI Command Center', icon: Terminal, action: () => onNavigate('/command') },
        { key: '⌘ 5', label: 'Runbooks & Automation', icon: BookOpen, action: () => onNavigate('/runbooks') },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="glass-panel border theme-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden transform transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b theme-border flex items-center justify-between card-bg-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-title flex items-center gap-2">
                D-OpsPilot AI Shortcuts
              </h3>
              <p className="text-xs text-subtitle">
                Quick key bindings for high-velocity navigation & actions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-subtitle hover:text-title hover:bg-slate-500/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {shortcutGroups.map((group, idx) => (
            <div key={idx} className="space-y-3">
              <h4 className="text-xs font-semibold text-subtitle uppercase tracking-wider font-mono">
                {group.title}
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {group.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={itemIdx}
                      onClick={() => {
                        if (item.action) {
                          item.action();
                          onClose();
                        }
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border theme-border card-bg-subtle ${
                        item.action ? 'cursor-pointer hover:border-blue-500/40 hover:bg-blue-500/5 transition' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="text-xs font-medium text-title">{item.label}</span>
                      </div>
                      <kbd className="px-2.5 py-1 rounded-lg bg-slate-900/10 dark:bg-white/10 text-[11px] font-mono font-bold text-subtitle border theme-border shadow-xs">
                        {item.key}
                      </kbd>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t theme-border card-bg-subtle flex items-center justify-between text-[11px] text-subtitle font-mono">
          <span>Press <kbd className="px-1.5 py-0.5 rounded border theme-border font-bold">Esc</kbd> to dismiss</span>
          <span className="text-blue-500 font-semibold">D-OpsPilot AI v1.0</span>
        </div>
      </div>
    </div>
  );
};
