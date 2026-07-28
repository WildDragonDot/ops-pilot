import React, { useState } from 'react';
import { FileCode, Plus, Minus, Terminal, Copy, Check } from 'lucide-react';

interface DiffViewerProps {
  diffText?: string;
  commands?: string[];
  title?: string;
}

interface ParsedLine {
  type: 'hunk' | 'add' | 'delete' | 'context';
  oldLine?: number;
  newLine?: number;
  content: string;
  raw: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ diffText, commands, title }) => {
  const [copied, setCopied] = useState(false);
  const [copiedCmdIndex, setCopiedCmdIndex] = useState<number | null>(null);

  if (!diffText && (!commands || commands.length === 0)) {
    return null;
  }

  // Parse unified diff into structured rows
  const parseDiff = (text: string) => {
    const lines = text.split('\n');
    const rows: ParsedLine[] = [];
    let additions = 0;
    let deletions = 0;
    let filePathFromFile: string | undefined;

    let currentOld = 1;
    let currentNew = 1;

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];

      // Handle raw file header markers --- and +++
      if (rawLine.startsWith('--- ')) {
        const match = rawLine.match(/^---\s+(?:a\/)?([^\s]+)/);
        if (match) filePathFromFile = match[1];
        continue;
      }
      if (rawLine.startsWith('+++ ')) {
        const match = rawLine.match(/^\+\+\+\s+(?:b\/)?([^\s]+)/);
        if (match && !filePathFromFile) filePathFromFile = match[1];
        continue;
      }

      // Hunk headers @@ -old,len +new,len @@
      if (rawLine.startsWith('@@')) {
        const hunkMatch = rawLine.match(/^@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@(.*)$/);
        if (hunkMatch) {
          currentOld = parseInt(hunkMatch[1], 10);
          currentNew = parseInt(hunkMatch[2], 10);
        }
        rows.push({
          type: 'hunk',
          content: rawLine,
          raw: rawLine
        });
        continue;
      }

      if (rawLine.startsWith('+')) {
        additions++;
        rows.push({
          type: 'add',
          newLine: currentNew++,
          content: rawLine.slice(1),
          raw: rawLine
        });
      } else if (rawLine.startsWith('-')) {
        deletions++;
        rows.push({
          type: 'delete',
          oldLine: currentOld++,
          content: rawLine.slice(1),
          raw: rawLine
        });
      } else {
        const content = rawLine.startsWith(' ') ? rawLine.slice(1) : rawLine;
        rows.push({
          type: 'context',
          oldLine: currentOld++,
          newLine: currentNew++,
          content,
          raw: rawLine
        });
      }
    }

    return { rows, additions, deletions, filePathFromFile };
  };

  const { rows, additions, deletions, filePathFromFile } = diffText
    ? parseDiff(diffText)
    : { rows: [], additions: 0, deletions: 0, filePathFromFile: undefined };

  const handleCopyDiff = () => {
    if (!diffText) return;
    navigator.clipboard.writeText(diffText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCmd = (cmd: string, idx: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmdIndex(idx);
    setTimeout(() => setCopiedCmdIndex(null), 2000);
  };

  // Title formatting for GitHub header bar
  const rawTitle = title || (filePathFromFile ? `Code Patch: ${filePathFromFile}` : 'Proposed Recovery Patch Diff');
  let titlePrefix = '';
  let filePath = rawTitle;

  if (rawTitle.includes('Code Patch:')) {
    const parts = rawTitle.split('Code Patch:');
    titlePrefix = 'Code Patch: ';
    filePath = parts[1].trim();
  } else if (rawTitle.includes('Proposed Code Patch')) {
    filePath = rawTitle;
  }

  const lastSlashIndex = filePath.lastIndexOf('/');
  const dirPath = lastSlashIndex !== -1 ? filePath.substring(0, lastSlashIndex + 1) : '';
  const fileName = lastSlashIndex !== -1 ? filePath.substring(lastSlashIndex + 1) : filePath;

  // Calculate GitHub 5-block diff indicator bar
  const totalChanges = additions + deletions;
  let greenBlocks = 0;
  let redBlocks = 0;
  if (totalChanges > 0) {
    greenBlocks = Math.round((additions / totalChanges) * 5);
    if (additions > 0 && greenBlocks === 0) greenBlocks = 1;
    if (additions > 0 && greenBlocks === 5 && deletions > 0) greenBlocks = 4;
    redBlocks = Math.min(5 - greenBlocks, deletions);
    if (deletions > 0 && redBlocks === 0) redBlocks = 1;
  }

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden my-3 text-xs font-mono shadow-xs bg-white dark:bg-[#0d1117]">
      {/* GitHub Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 dark:bg-[#161b22] border-b border-slate-200 dark:border-slate-800 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
          <div className="font-mono text-xs truncate">
            {titlePrefix && <span className="text-slate-700 dark:text-slate-300 font-semibold mr-1.5">{titlePrefix}</span>}
            {dirPath && <span className="text-slate-500 dark:text-slate-400 font-normal">{dirPath}</span>}
            <span className="font-bold text-slate-900 dark:text-slate-100">{fileName}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {diffText && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                +{additions}
              </span>
              <span className="font-semibold text-rose-700 dark:text-rose-400">
                -{deletions}
              </span>

              {/* GitHub 5-block diff indicator */}
              <div className="flex gap-[2px] items-center ml-1">
                {Array.from({ length: 5 }).map((_, i) => {
                  let bg = 'bg-slate-200 dark:bg-slate-700';
                  if (i < greenBlocks) {
                    bg = 'bg-emerald-600 dark:bg-emerald-500';
                  } else if (i < greenBlocks + redBlocks) {
                    bg = 'bg-rose-600 dark:bg-rose-500';
                  }
                  return <div key={i} className={`w-2 h-2 rounded-[1px] ${bg}`} />;
                })}
              </div>
            </div>
          )}

          {diffText && (
            <button
              onClick={handleCopyDiff}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title="Copy diff"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
            </button>
          )}
        </div>
      </div>

      {/* Terminal Commands Execution Plan */}
      {commands && commands.length > 0 && (
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 space-y-2">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            Execution Commands Plan
          </div>
          <div className="space-y-1 font-mono">
            {commands.map((cmd, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 bg-slate-950/80 px-3 py-1.5 rounded border border-slate-800 text-xs">
                <div className="flex items-center gap-2 min-w-0 overflow-x-auto">
                  <span className="text-emerald-400 shrink-0 select-none">$</span>
                  <code className="text-slate-200 font-mono whitespace-nowrap">{cmd}</code>
                </div>
                <button
                  onClick={() => handleCopyCmd(cmd, idx)}
                  className="p-1 text-slate-400 hover:text-slate-200 transition-colors shrink-0"
                  title="Copy command"
                >
                  {copiedCmdIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GitHub Code Diff Table */}
      {diffText && rows.length > 0 && (
        <div className="overflow-x-auto max-h-96 leading-relaxed font-mono">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <tbody>
              {rows.map((row, idx) => {
                if (row.type === 'hunk') {
                  return (
                    <tr key={idx} className="bg-[#ddf4ff] dark:bg-blue-950/40 border-y border-blue-200/50 dark:border-blue-900/50">
                      <td colSpan={4} className="px-4 py-1 font-mono text-xs text-[#0969da] dark:text-[#58a6ff] select-none font-semibold">
                        {row.content}
                      </td>
                    </tr>
                  );
                }

                if (row.type === 'add') {
                  return (
                    <tr key={idx} className="bg-[#e6ffec] dark:bg-emerald-950/30 hover:bg-[#d4f7dc] dark:hover:bg-emerald-900/40 transition-colors">
                      <td className="w-10 sm:w-12 text-right pr-3 pl-2 py-0.5 select-none text-[11px] font-mono text-slate-400 dark:text-slate-500 bg-[#ccffd8]/40 dark:bg-emerald-950/60 border-r border-emerald-200/40 dark:border-emerald-900/40">
                        {row.oldLine ?? ''}
                      </td>
                      <td className="w-10 sm:w-12 text-right pr-3 pl-2 py-0.5 select-none text-[11px] font-mono text-emerald-800 dark:text-emerald-300 bg-[#ccffd8] dark:bg-emerald-950/70 border-r border-emerald-200/40 dark:border-emerald-900/40 font-semibold">
                        {row.newLine ?? ''}
                      </td>
                      <td className="w-6 text-center py-0.5 select-none font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400">
                        +
                      </td>
                      <td className="py-0.5 pr-4 pl-1 font-mono text-xs whitespace-pre text-[#1f2328] dark:text-[#e6edf3]">
                        {row.content}
                      </td>
                    </tr>
                  );
                }

                if (row.type === 'delete') {
                  return (
                    <tr key={idx} className="bg-[#ffebe9] dark:bg-rose-950/30 hover:bg-[#ffdbd8] dark:hover:bg-rose-900/40 transition-colors">
                      <td className="w-10 sm:w-12 text-right pr-3 pl-2 py-0.5 select-none text-[11px] font-mono text-rose-800 dark:text-rose-300 bg-[#ffd7d5] dark:bg-rose-950/70 border-r border-rose-200/40 dark:border-rose-900/40 font-semibold">
                        {row.oldLine ?? ''}
                      </td>
                      <td className="w-10 sm:w-12 text-right pr-3 pl-2 py-0.5 select-none text-[11px] font-mono text-slate-400 dark:text-slate-500 bg-[#ffd7d5]/40 dark:bg-rose-950/60 border-r border-rose-200/40 dark:border-rose-900/40">
                        {row.newLine ?? ''}
                      </td>
                      <td className="w-6 text-center py-0.5 select-none font-mono font-bold text-xs text-rose-700 dark:text-rose-400">
                        -
                      </td>
                      <td className="py-0.5 pr-4 pl-1 font-mono text-xs whitespace-pre text-[#1f2328] dark:text-[#e6edf3]">
                        {row.content}
                      </td>
                    </tr>
                  );
                }

                // Context row
                return (
                  <tr key={idx} className="bg-white dark:bg-[#0d1117] hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="w-10 sm:w-12 text-right pr-3 pl-2 py-0.5 select-none text-[11px] font-mono text-slate-400 dark:text-slate-500 bg-slate-50/70 dark:bg-[#161b22]/70 border-r border-slate-200/40 dark:border-slate-800/40">
                      {row.oldLine ?? ''}
                    </td>
                    <td className="w-10 sm:w-12 text-right pr-3 pl-2 py-0.5 select-none text-[11px] font-mono text-slate-400 dark:text-slate-500 bg-slate-50/70 dark:bg-[#161b22]/70 border-r border-slate-200/40 dark:border-slate-800/40">
                      {row.newLine ?? ''}
                    </td>
                    <td className="w-6 text-center py-0.5 select-none font-mono text-xs text-slate-300 dark:text-slate-600">
                      
                    </td>
                    <td className="py-0.5 pr-4 pl-1 font-mono text-xs whitespace-pre text-[#1f2328] dark:text-[#c9d1d9]">
                      {row.content}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

