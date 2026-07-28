import React from 'react';
import { FileCode, Plus, Minus, Terminal } from 'lucide-react';

interface DiffViewerProps {
  diffText?: string;
  commands?: string[];
  title?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ diffText, commands, title }) => {
  if (!diffText && (!commands || commands.length === 0)) {
    return null;
  }

  const lines = diffText ? diffText.split('\n') : [];
  const additions = lines.filter(l => l.startsWith('+') && !l.startsWith('+++')).length;
  const deletions = lines.filter(l => l.startsWith('-') && !l.startsWith('---')).length;

  return (
    <div className="rounded-xl border theme-border overflow-hidden my-2 text-xs font-mono shadow-sm card-bg-subtle text-title">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 card-bg-subtle border-b theme-border text-title">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="font-extrabold text-title">{title || 'Proposed Recovery Patch Diff'}</span>
        </div>
        {diffText && (
          <div className="flex items-center gap-2 text-[11px] font-bold font-mono">
            <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <Plus className="w-3 h-3" /> {additions}
            </span>
            <span className="flex items-center gap-0.5 text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              <Minus className="w-3 h-3" /> {deletions}
            </span>
          </div>
        )}
      </div>

      {/* Terminal Commands List */}
      {commands && commands.length > 0 && (
        <div className="p-3 border-b theme-border card-bg-subtle space-y-2">
          <div className="text-[10px] text-subtitle uppercase tracking-widest font-mono font-bold flex items-center gap-1.5">
            <Terminal className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Execution Commands Plan:
          </div>
          <div className="space-y-1.5 font-mono">
            {commands.map((cmd, idx) => (
              <div key={idx} className="flex items-center gap-2 theme-pill px-3 py-2 rounded-lg border theme-border font-bold shadow-xs">
                <span className="text-blue-600 dark:text-blue-400 shrink-0">$</span>
                <code className="text-title font-mono text-xs">{cmd}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Git Diff Code Section */}
      {diffText && (
        <div className="p-3 overflow-x-auto max-h-80 leading-relaxed font-mono card-bg-subtle">
          {lines.map((line, idx) => {
            let lineClass = 'text-subtitle py-0.5 px-2';
            if (line.startsWith('---') || line.startsWith('+++')) {
              lineClass = 'text-subtitle font-bold py-0.5 px-2 bg-slate-200/50 dark:bg-slate-800/50';
            } else if (line.startsWith('+')) {
              lineClass = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold py-0.5 px-2 border-l-2 border-emerald-500';
            } else if (line.startsWith('-')) {
              lineClass = 'bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold py-0.5 px-2 border-l-2 border-rose-500';
            } else if (line.startsWith('@@')) {
              lineClass = 'text-purple-600 dark:text-purple-400 font-bold py-1 px-2 bg-purple-500/10 my-1 rounded';
            }

            return (
              <div key={idx} className={`${lineClass} whitespace-pre`}>
                {line}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
