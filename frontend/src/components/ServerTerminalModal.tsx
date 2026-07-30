import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, 
  X, 
  Send, 
  Loader2, 
  Cpu, 
  Trash2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Maximize2, 
  Minimize2,
  TerminalSquare,
  Play
} from 'lucide-react';
import { executeCommandOnServer } from '../services/api';

interface ServerTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverHost?: string;
  serverUser?: string;
}

interface CommandHistoryItem {
  id: string;
  command: string;
  output: string;
  exitCode: number;
  time: string;
}

export const ServerTerminalModal: React.FC<ServerTerminalModalProps> = ({
  isOpen,
  onClose,
  serverHost = '34.224.80.31',
  serverUser = 'ubuntu'
}) => {
  const [commandInput, setCommandInput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executingCmd, setExecutingCmd] = useState<string>('');
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [history, setHistory] = useState<CommandHistoryItem[]>([
    {
      id: 'init-1',
      command: 'opspilot --version',
      output: 'OpsPilot Real-Time Server SSH Shell v1.0.0 (Connected via AES-256 WebCrypto Vault)',
      exitCode: 0,
      time: new Date().toTimeString().split(' ')[0]
    }
  ]);
  const [cmdHistoryList, setCmdHistoryList] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [copied, setCopied] = useState<boolean>(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isExecuting]);

  if (!isOpen) return null;

  const handleRunCommand = async (cmdToRun?: string) => {
    const targetCmd = (cmdToRun || commandInput).trim();
    if (!targetCmd || isExecuting) return;

    if (targetCmd.toLowerCase() === 'clear') {
      setHistory([]);
      setCommandInput('');
      return;
    }

    if (targetCmd.toLowerCase() === 'help') {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      setHistory(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          command: 'help',
          output: `Available Quick Shell Commands:\n  - docker ps                 (Inspect container states)\n  - curl http://localhost:8080/health (Check HTTP proxy status)\n  - free -m                   (Inspect RAM memory allocation)\n  - uptime                    (Check server load average)\n  - git status                (Check git working tree)\n  - ls -la                    (List directory contents)\n  - clear                     (Clear terminal screen)`,
          exitCode: 0,
          time: timeStr
        }
      ]);
      setCommandInput('');
      return;
    }

    try {
      setIsExecuting(true);
      setExecutingCmd(targetCmd);
      setCmdHistoryList(prev => [...prev, targetCmd]);
      setHistoryIndex(-1);

      const res = await executeCommandOnServer(targetCmd);
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];

      setHistory(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          command: targetCmd,
          output: res.output,
          exitCode: res.exitCode,
          time: timeStr
        }
      ]);
      setCommandInput('');
    } catch (err: any) {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      setHistory(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          command: targetCmd,
          output: `[ERROR] ${err.message || 'Execution failed'}`,
          exitCode: 1,
          time: timeStr
        }
      ]);
      setCommandInput('');
    } finally {
      setIsExecuting(false);
      setExecutingCmd('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRunCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistoryList.length === 0) return;
      const nextIdx = historyIndex + 1 < cmdHistoryList.length ? historyIndex + 1 : historyIndex;
      setHistoryIndex(nextIdx);
      setCommandInput(cmdHistoryList[cmdHistoryList.length - 1 - nextIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setCommandInput(cmdHistoryList[cmdHistoryList.length - 1 - nextIdx] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommandInput('');
      }
    }
  };

  const handleCopyLogs = () => {
    const text = history.map(h => `[${h.time}] ${serverUser}@${serverHost}:~$ ${h.command}\n${h.output}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const presetCommands = [
    'docker ps',
    'curl http://localhost:8080/health',
    'free -m',
    'uptime',
    'git status',
    'ls -la'
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className={`glass-panel w-full rounded-2xl border border-slate-800 bg-[#050811] shadow-2xl flex flex-col overflow-hidden font-sans transition-all duration-300 ${
            isMaximized ? 'h-[96vh] max-w-[98vw]' : 'h-[82vh] max-w-4xl'
          }`}
        >
          {/* Top Window Bar */}
          <div className="px-4 py-3 bg-[#0a0f1d] border-b border-slate-800 flex items-center justify-between font-mono text-xs select-none">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block cursor-pointer hover:opacity-80 transition" onClick={onClose} title="Close Terminal" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block cursor-pointer hover:opacity-80 transition" onClick={() => setIsMaximized(!isMaximized)} title="Maximize/Restore" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-200 font-bold truncate">
                {serverUser}@{serverHost} <span className="text-slate-500 font-normal text-[10px] hidden sm:inline">(Interactive Remote SSH Terminal)</span>
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden md:flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold font-mono">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> WebCrypto Encrypted Session
              </span>

              <button
                onClick={handleCopyLogs}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition flex items-center gap-1 text-[11px]"
                title="Copy Terminal Log"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={() => setHistory([])}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 transition"
                title="Clear Terminal Output"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
                title={isMaximized ? 'Minimize' : 'Maximize'}
              >
                {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
                title="Close Window"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Preset Command Pills Toolbar */}
          <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-900 flex items-center gap-2 overflow-x-auto select-none font-mono text-[10px]">
            <span className="text-slate-500 shrink-0 font-bold">Quick Presets:</span>
            {presetCommands.map(cmd => (
              <button
                key={cmd}
                onClick={() => handleRunCommand(cmd)}
                disabled={isExecuting}
                className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-blue-600 hover:text-white text-slate-300 border border-slate-800 transition shrink-0 cursor-pointer font-bold flex items-center gap-1"
              >
                <Play className="w-2.5 h-2.5 text-emerald-400 fill-current" />
                <span>{cmd}</span>
              </button>
            ))}
          </div>

          {/* Terminal Screen Body */}
          <div 
            onClick={() => inputRef.current?.focus()}
            className="p-4 flex-1 overflow-y-auto font-mono text-xs leading-relaxed space-y-3 bg-[#03060f] cursor-text"
          >
            <div className="text-slate-500 text-[11px] pb-2 border-b border-slate-900">
              Connected to <b>{serverUser}@{serverHost}</b>. Type shell commands directly below or click presets above. Type <b className="text-blue-400">help</b> for instructions, <b className="text-blue-400">clear</b> to clear.
            </div>

            {history.map((item) => (
              <div key={item.id} className="space-y-1">
                {/* Command Line Prompt */}
                <div className="flex items-center gap-2 text-slate-300 flex-wrap">
                  <span className="text-emerald-400 font-bold">{serverUser}@{serverHost}:~$</span>
                  <span className="text-slate-100 font-bold">{item.command}</span>
                  <span className="text-[10px] text-slate-600 font-mono ml-auto">[{item.time}]</span>
                </div>

                {/* Command Output */}
                <pre className={`p-3 rounded-lg text-[11px] overflow-x-auto border font-mono whitespace-pre-wrap leading-relaxed ${
                  item.exitCode === 0
                    ? 'bg-slate-950/90 text-slate-200 border-slate-900 shadow-inner'
                    : 'bg-rose-950/30 text-rose-300 border-rose-900/50 shadow-inner'
                }`}>
                  {item.output}
                </pre>
              </div>
            ))}

            {/* Glowing Thinking & Execution Loader Block */}
            {isExecuting && (
              <div className="space-y-1.5 animate-pulse my-2">
                <div className="flex items-center gap-2 text-slate-300 font-mono text-xs">
                  <span className="text-emerald-400 font-bold">{serverUser}@{serverHost}:~$</span>
                  <span className="text-blue-400 font-bold">{executingCmd || commandInput}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/40 text-blue-300 font-mono text-xs flex items-center gap-3 shadow-lg glow-blue">
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-extrabold text-blue-400 tracking-wide uppercase text-[10px] block">
                      ⚡ SSH COMMAND EXECUTING ON REMOTE SERVER...
                    </span>
                    <span className="text-slate-200 text-[11px] font-semibold">
                      Thinking & Fetching live response from <b className="text-blue-300 font-bold">{serverUser}@{serverHost}</b>...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Live Active Command Input Line */}
            <div className="flex items-center gap-2 pt-2 text-slate-200 font-mono">
              <span className="text-emerald-400 font-bold shrink-0">{serverUser}@{serverHost}:~$</span>
              <input
                ref={inputRef}
                type="text"
                value={commandInput}
                disabled={isExecuting}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isExecuting ? 'Executing command on server...' : 'Type command (e.g. docker ps)...'}
                className="flex-1 bg-transparent text-slate-100 font-mono text-xs focus:outline-none border-none placeholder-slate-600"
              />
              {isExecuting ? (
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
              ) : (
                <button
                  onClick={() => handleRunCommand()}
                  className="p-1 text-slate-400 hover:text-emerald-400 transition"
                  title="Run Command (Enter)"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div ref={bottomRef} />
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
