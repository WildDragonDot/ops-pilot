import React, { useState } from 'react';
import { Terminal, Copy, Check, FileCode, Shield, CheckCircle2, Info } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);

  const handleCopyCode = (codeText: string, idx: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  // Helper to parse inline formatting (**bold** and `code`)
  const renderFormattedText = (text: string) => {
    // Regex for bold **text** and code `text`
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900 dark:text-slate-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        const val = part.slice(1, -1);
        let badgeColor = 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700';
        if (val === 'HIGH' || val === 'CRITICAL') {
          badgeColor = 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20';
        } else if (val === 'RESOLVED' || val === 'HEALTHY') {
          badgeColor = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
        }

        return (
          <code
            key={i}
            className={`px-1.5 py-0.5 rounded text-xs font-mono font-semibold border ${badgeColor} inline-block my-0.5`}
          >
            {val}
          </code>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  // Parse markdown content into structured blocks
  const parseBlocks = (raw: string) => {
    const lines = raw.split('\n');
    const blocks: { type: string; content?: string; lines?: string[]; lang?: string }[] = [];
    let inCodeBlock = false;
    let currentCodeLines: string[] = [];
    let currentCodeLang = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code block start/end
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          blocks.push({
            type: 'code',
            lines: currentCodeLines,
            lang: currentCodeLang
          });
          currentCodeLines = [];
          currentCodeLang = '';
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          currentCodeLang = line.trim().replace('```', '').trim() || 'bash';
        }
        continue;
      }

      if (inCodeBlock) {
        currentCodeLines.push(line);
        continue;
      }

      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('# ')) {
        blocks.push({ type: 'h1', content: trimmed.slice(2) });
      } else if (trimmed.startsWith('## ')) {
        blocks.push({ type: 'h2', content: trimmed.slice(3) });
      } else if (trimmed.startsWith('### ')) {
        blocks.push({ type: 'h3', content: trimmed.slice(4) });
      } else if (trimmed === '---') {
        blocks.push({ type: 'hr' });
      } else if (trimmed.startsWith('> ')) {
        blocks.push({ type: 'quote', content: trimmed.slice(2) });
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        blocks.push({ type: 'list-item', content: trimmed.slice(2) });
      } else {
        blocks.push({ type: 'paragraph', content: trimmed });
      }
    }

    return blocks;
  };

  const blocks = parseBlocks(content);

  let codeBlockCount = 0;

  return (
    <div className="space-y-4 text-slate-800 dark:text-slate-200 text-sm leading-relaxed font-sans">
      {blocks.map((block, idx) => {
        if (block.type === 'h1') {
          return (
            <div key={idx} className="border-b border-slate-200 dark:border-slate-800 pb-2.5 mb-3">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {block.content}
              </h1>
            </div>
          );
        }

        if (block.type === 'h2') {
          return (
            <div key={idx} className="pt-2 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
              <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></span>
                {block.content}
              </h2>
            </div>
          );
        }

        if (block.type === 'h3') {
          return (
            <h3 key={idx} className="text-xs font-bold text-slate-800 dark:text-slate-200 pt-1.5">
              {block.content}
            </h3>
          );
        }

        if (block.type === 'hr') {
          return <hr key={idx} className="my-3 border-slate-200 dark:border-slate-800" />;
        }

        if (block.type === 'quote') {
          return (
            <div
              key={idx}
              className="p-2.5 my-2 rounded-r-md border-l-3 border-l-blue-600 dark:border-l-blue-500 bg-blue-50/60 dark:bg-blue-950/30 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-medium leading-relaxed"
            >
              {renderFormattedText(block.content || '')}
            </div>
          );
        }

        if (block.type === 'code') {
          const codeIdx = codeBlockCount++;
          const codeStr = (block.lines || []).join('\n');
          return (
            <div
              key={idx}
              className="my-2 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 font-mono text-[11px] shadow-xs"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-b border-slate-800 text-[10px] font-mono">
                <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider">
                  <Terminal className="w-3 h-3 text-emerald-400" />
                  <span>{block.lang || 'bash'} execution trace</span>
                </div>
                <button
                  onClick={() => handleCopyCode(codeStr, codeIdx)}
                  className="p-1 rounded text-slate-400 hover:text-slate-200 transition"
                  title="Copy code"
                >
                  {copiedCodeIdx === codeIdx ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
              <pre className="p-3 overflow-x-auto text-[11px] leading-relaxed text-emerald-400 whitespace-pre font-mono">
                {codeStr}
              </pre>
            </div>
          );
        }

        if (block.type === 'list-item') {
          return (
            <div key={idx} className="flex items-start gap-1.5 ml-1.5 my-0.5 text-[11px]">
              <span className="text-blue-500 font-bold">•</span>
              <div className="text-slate-700 dark:text-slate-300">
                {renderFormattedText(block.content || '')}
              </div>
            </div>
          );
        }

        // Paragraph
        return (
          <p key={idx} className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed my-1 font-normal">
            {renderFormattedText(block.content || '')}
          </p>
        );
      })}
    </div>
  );
};
