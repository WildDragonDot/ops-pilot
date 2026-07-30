import React, { useState } from 'react';
import { Terminal, Copy, Check, Play, ShieldAlert, Cpu, X, Sparkles, Filter } from 'lucide-react';
import { IncidentEvent } from '../types';

interface TerminalConsoleProps {
  events: IncidentEvent[];
  incidentId: string;
  onClose?: () => void;
}

export const TerminalConsole: React.FC<TerminalConsoleProps> = ({ events, incidentId, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [aiNoiseFilter, setAiNoiseFilter] = useState<boolean>(true);

  const rawToolCalls = events.filter(e => e.type === 'TOOL_CALL' || e.type === 'PLAN' || e.type === 'EXECUTION');
  
  // Smart AI Noise Purger
  const toolCalls = aiNoiseFilter 
    ? rawToolCalls.filter(e => {
        const title = (e.title || '').toLowerCase();
        if (title.includes('ping') || title.includes('heartbeat') || title.includes('debug')) return false;
        return true;
      })
    : rawToolCalls;

  const handleCopy = () => {
    const text = toolCalls.map(e => `[${e.type}] ${e.title}\n${e.details ? JSON.stringify(e.details, null, 2) : ''}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#050811] overflow-hidden shadow-2xl space-y-0 w-full max-w-4xl mx-auto">
      
      {/* Console Header Bar */}
      <div className="px-4 py-3 bg-[#0a0f1d] border-b border-slate-800 flex items-center justify-between font-mono text-xs select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block cursor-pointer hover:opacity-80 transition" onClick={onClose} title="Close Logs" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-200 font-bold truncate">dop-agent-cli --incident={incidentId}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* AI Noise Purger Toggle */}
          <button
            onClick={() => setAiNoiseFilter(!aiNoiseFilter)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition border cursor-pointer ${
              aiNoiseFilter
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm glow-purple'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
            <span>{aiNoiseFilter ? '✨ AI Noise Purged' : 'Show Raw Noise'}</span>
          </button>

          <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <Cpu className="w-3 h-3 animate-pulse" /> OpenAI GPT-4o Agent Active
          </span>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              title="Close Modal"
              aria-label="Close terminal console"
              className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Terminal Screen Output */}
      <div className="p-4 max-h-[65vh] overflow-y-auto space-y-3 font-mono text-xs leading-relaxed">
        <div className="text-slate-500">
          OpsPilot Agent v1.0.0 (x86_64-apple-darwin26) - OpenAI Tool Calling Session Initialized.
        </div>

        {toolCalls.length === 0 ? (
          <div className="text-slate-500 py-6 text-center">
            Waiting for prompt invocation... Run outage investigation above to stream terminal logs.
          </div>
        ) : (
          toolCalls.map((evt, idx) => (
            <div key={evt.id || idx} className="space-y-1">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-emerald-400 font-bold">$</span>
                <span className="text-slate-200 font-semibold">{evt.title}</span>
                <span className="text-[10px] text-slate-600">[{new Date(evt.createdAt).toLocaleTimeString()}]</span>
              </div>

              {evt.details?.command && (
                <div className="text-blue-400 bg-slate-950 p-2 rounded border border-slate-900">
                  Executing: {evt.details.command}
                </div>
              )}

              {evt.details?.output && (
                <pre className="text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-900 overflow-x-auto text-[11px]">
                  {evt.details.output}
                </pre>
              )}

              {evt.details?.steps && (
                <div className="text-cyan-300 bg-slate-950 p-2 rounded border border-slate-900 space-y-0.5">
                  {evt.details.steps.map((s: string, i: number) => (
                    <div key={i}>➔ {s}</div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        <div className="flex items-center gap-2 text-emerald-400 pt-2 border-t border-slate-900">
          <span className="w-2 h-4 bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-slate-500">Agent session listening for incoming tool events...</span>
        </div>
      </div>

    </div>
  );
};
