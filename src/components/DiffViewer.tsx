import React from 'react';
import { FileCode, Plus, Minus } from 'lucide-react';

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
    <div className="rounded-lg border border-slate-800 bg-[#0b1220] overflow-hidden my-3 text-xs font-mono">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800 text-slate-300">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-slate-200">{title || 'Proposed Recovery Patch Diff'}</span>
        </div>
        {diffText && (
          <div className="flex items-center gap-2 text-[11px]">
            <span className="flex items-center text-emerald-400 font-medium">
              <Plus className="w-3 h-3" /> {additions}
            </span>
            <span className="flex items-center text-rose-400 font-medium">
              <Minus className="w-3 h-3" /> {deletions}
            </span>
          </div>
        )}
      </div>

      {/* Commands List */}
      {commands && commands.length > 0 && (
        <div className="p-3 bg-slate-950/80 border-b border-slate-800/80">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-2 font-sans font-semibold">
            Execution Commands:
          </div>
          <div className="space-y-1.5">
            {commands.map((cmd, idx) => (
              <div key={idx} className="flex items-center gap-2 text-slate-200 bg-slate-900/60 p-2 rounded border border-slate-800/60">
                <span className="text-blue-400 font-bold">$</span>
                <code>{cmd}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Diff Code Body */}
      {diffText && (
        <div className="p-2 overflow-x-auto max-h-80 leading-relaxed font-mono">
          {lines.map((line, idx) => {
            let lineClass = 'text-slate-300 py-0.5 px-1';
            if (line.startsWith('---') || line.startsWith('+++')) {
              lineClass = 'diff-header text-slate-400';
            } else if (line.startsWith('+')) {
              lineClass = 'diff-add';
            } else if (line.startsWith('-')) {
              lineClass = 'diff-remove';
            } else if (line.startsWith('@@')) {
              lineClass = 'text-purple-400 py-0.5 px-1 font-bold';
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
