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
    <div className="rounded-xl border theme-border overflow-hidden my-2 text-xs font-mono shadow-sm bg-[#090d16] text-slate-200">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0e1422] border-b border-slate-800 text-slate-300">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-blue-400" />
          <span className="font-bold text-slate-100">{title || 'Proposed Recovery Patch Diff'}</span>
        </div>
        {diffText && (
          <div className="flex items-center gap-2 text-[11px] font-bold font-mono">
            <span className="flex items-center gap-0.5 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <Plus className="w-3 h-3" /> {additions}
            </span>
            <span className="flex items-center gap-0.5 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              <Minus className="w-3 h-3" /> {deletions}
            </span>
          </div>
        )}
      </div>

      {/* Terminal Commands List */}
      {commands && commands.length > 0 && (
        <div className="p-3 border-b border-slate-800 bg-[#0b0f19] space-y-2">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold flex items-center gap-1.5">
            <Terminal className="w-3 h-3 text-emerald-400" />
            Execution Commands Plan:
          </div>
          <div className="space-y-1.5 font-mono">
            {commands.map((cmd, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-[#131929] px-3 py-2 rounded-lg border border-slate-800/80 text-emerald-400 font-bold">
                <span className="text-blue-400 shrink-0">$</span>
                <code className="text-slate-100 font-mono text-xs">{cmd}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Git Diff Code Section */}
      {diffText && (
        <div className="p-3 overflow-x-auto max-h-80 leading-relaxed font-mono bg-[#090d16]">
          {lines.map((line, idx) => {
            let lineClass = 'text-slate-400 py-0.5 px-2';
            if (line.startsWith('---') || line.startsWith('+++')) {
              lineClass = 'text-slate-400 font-bold py-0.5 px-2 bg-slate-900/60';
            } else if (line.startsWith('+')) {
              lineClass = 'bg-emerald-500/15 text-emerald-300 font-semibold py-0.5 px-2 border-l-2 border-emerald-500';
            } else if (line.startsWith('-')) {
              lineClass = 'bg-rose-500/15 text-rose-300 font-semibold py-0.5 px-2 border-l-2 border-rose-500';
            } else if (line.startsWith('@@')) {
              lineClass = 'text-purple-400 font-bold py-1 px-2 bg-purple-500/10 my-1 rounded';
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
