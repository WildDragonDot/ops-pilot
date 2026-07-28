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
    <div className="rounded-lg border theme-border theme-code-block overflow-hidden my-3 text-xs font-mono">
      <div className="flex items-center justify-between px-3 py-2 card-bg-subtle border-b theme-border text-subtitle">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-title">{title || 'Proposed Recovery Patch Diff'}</span>
        </div>
        {diffText && (
          <div className="flex items-center gap-2 text-[11px]">
            <span className="flex items-center text-emerald-500 font-medium">
              <Plus className="w-3 h-3" /> {additions}
            </span>
            <span className="flex items-center text-rose-500 font-medium">
              <Minus className="w-3 h-3" /> {deletions}
            </span>
          </div>
        )}
      </div>

      {commands && commands.length > 0 && (
        <div className="p-3 card-bg-subtle border-b theme-border">
          <div className="text-[11px] text-subtitle uppercase tracking-wider mb-2 font-sans font-semibold">
            Execution Commands:
          </div>
          <div className="space-y-1.5">
            {commands.map((cmd, idx) => (
              <div key={idx} className="flex items-center gap-2 text-title card-bg-subtle p-2 rounded border theme-border">
                <span className="text-blue-500 font-bold">$</span>
                <code>{cmd}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      {diffText && (
        <div className="p-2 overflow-x-auto max-h-80 leading-relaxed font-mono">
          {lines.map((line, idx) => {
            let lineClass = 'text-subtitle py-0.5 px-1';
            if (line.startsWith('---') || line.startsWith('+++')) {
              lineClass = 'diff-header text-subtitle';
            } else if (line.startsWith('+')) {
              lineClass = 'diff-add';
            } else if (line.startsWith('-')) {
              lineClass = 'diff-remove';
            } else if (line.startsWith('@@')) {
              lineClass = 'text-purple-500 py-0.5 px-1 font-bold';
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
