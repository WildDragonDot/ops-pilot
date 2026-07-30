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
  Play,
  Sparkles,
  Search,
  HelpCircle,
  Lightbulb,
  ChevronRight
} from 'lucide-react';
import { executeCommandOnServer, suggestAICommandApi } from '../services/api';

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

interface ProblemCommandItem {
  problem: string;
  command: string;
  description: string;
  category: 'DOCKER' | 'NGINX' | 'SYSTEM' | 'NETWORK' | 'LOGS';
}

const PROBLEM_COMMAND_DATABASE: ProblemCommandItem[] = [
  { problem: 'Check running docker containers', command: 'sudo docker ps', description: 'List all active Docker containers and open ports', category: 'DOCKER' },
  { problem: 'Check all container logs', command: 'sudo docker logs --tail 50 finance-lock-nanomdm', description: 'Tail recent 50 logs for NanoMDM container', category: 'DOCKER' },
  { problem: 'Restart redis container', command: 'sudo docker restart finance-lock-redis', description: 'Restart Redis container on host', category: 'DOCKER' },
  { problem: 'Restart postgres database', command: 'sudo docker restart finance-lock-postgres', description: 'Restart PostgreSQL container on host', category: 'DOCKER' },
  { problem: 'Nginx access log search for mdm apk', command: "sudo grep 'mdm-agent.apk' /var/log/nginx/access.log | tail -n 20", description: 'Filter Nginx access logs for MDM agent APK requests', category: 'NGINX' },
  { problem: 'Nginx error logs check', command: 'sudo tail -n 30 /var/log/nginx/error.log', description: 'View latest 30 Nginx server error entries', category: 'NGINX' },
  { problem: 'Nginx config test', command: 'sudo nginx -t', description: 'Verify Nginx syntax configuration integrity', category: 'NGINX' },
  { problem: 'Check RAM memory usage & top processes', command: 'free -m && top -b -n 1 | head -n 15', description: 'View total vs used RAM allocation and top processes', category: 'SYSTEM' },
  { problem: 'Check disk space allocation', command: 'df -h /', description: 'Inspect root filesystem storage usage', category: 'SYSTEM' },
  { problem: 'Check active listening TCP ports', command: 'sudo netstat -tulpn || sudo ss -tulpn', description: 'List all open server ports and listening PIDs', category: 'NETWORK' },
  { problem: 'Test local HTTP proxy endpoint', command: 'curl -I http://localhost:8080/health', description: 'Send HTTP GET ping to local proxy port 8080', category: 'NETWORK' },
  { problem: 'Check system authentication logs', command: 'sudo tail -n 20 /var/log/auth.log', description: 'Inspect SSH logins and sudo privileges log', category: 'LOGS' }
];

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
  const [showAiCopilot, setShowAiCopilot] = useState<boolean>(false);
  const [aiProblemQuery, setAiProblemQuery] = useState<string>('');
  const [suggestedCommand, setSuggestedCommand] = useState<string>('');
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
      setCommandInput('');
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

  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [aiExplanation, setAiExplanation] = useState<string>('');

  const handleProblemSearch = async (query: string) => {
    setAiProblemQuery(query);
    const q = query.toLowerCase().trim();
    if (!q) {
      setSuggestedCommand('');
      setAiExplanation('');
      return;
    }

    try {
      setIsAiThinking(true);
      const res = await suggestAICommandApi(query, serverHost, serverUser);
      if (res && res.command) {
        setSuggestedCommand(res.command);
        setAiExplanation(res.explanation || '');
      }
    } catch (e) {
      if (q.includes('setup') || q.includes('system') || q.includes('server') || q.includes('details') || q.includes('info') || q.includes('kya h')) {
        setSuggestedCommand('uname -a && uptime && sudo docker ps');
        setAiExplanation('Displays OS kernel details, server uptime & load, and all active Docker containers');
      } else if (q.includes('apk') || q.includes('mdm')) {
        setSuggestedCommand("sudo grep 'mdm-agent.apk' /var/log/nginx/access.log | tail -n 20");
        setAiExplanation('Filters Nginx access logs for MDM agent APK download requests');
      } else {
        setSuggestedCommand('sudo docker ps');
        setAiExplanation('Lists active Docker containers on remote host');
      }
    } finally {
      setIsAiThinking(false);
    }
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
      {isOpen && (
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
            isMaximized ? 'h-[96vh] max-w-[98vw]' : 'h-[85vh] max-w-5xl'
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
              <button
                onClick={() => setShowAiCopilot(!showAiCopilot)}
                className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer border ${
                  showAiCopilot
                    ? 'bg-purple-600 text-white border-purple-500 shadow-md glow-blue'
                    : 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20'
                }`}
                title="Toggle AI Command Copilot Drawer"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400 fill-current animate-pulse" />
                <span>AI Copilot</span>
              </button>

              <span className="hidden lg:flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold font-mono">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> WebCrypto Encrypted
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
          <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-900 flex items-center justify-between gap-3 select-none font-mono text-[10px]">
            <div className="flex items-center gap-2 overflow-x-auto">
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

            <button
              onClick={() => setShowAiCopilot(!showAiCopilot)}
              className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Lightbulb className="w-3 h-3 text-purple-400" />
              <span>{showAiCopilot ? 'Hide AI Solver Drawer' : 'Problem ➔ Command Assistant'}</span>
            </button>
          </div>

          {/* AI Natural Language Problem ➔ Command Solver Input Bar */}
          <div className="px-4 py-2.5 bg-[#080d1a] border-b border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-1 card-bg-subtle px-3 py-1.5 rounded-xl border border-purple-500/30">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />
              <input
                type="text"
                value={aiProblemQuery}
                onChange={(e) => handleProblemSearch(e.target.value)}
                placeholder="Ask AI Copilot in Hindi/English (e.g. 'mera server setup kya h', 'nginx logs dekho', 'ram memory check')..."
                className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
              />
              {isAiThinking && <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin shrink-0" />}
              {aiProblemQuery && !isAiThinking && (
                <button onClick={() => { setAiProblemQuery(''); setSuggestedCommand(''); setAiExplanation(''); }} className="text-slate-500 hover:text-slate-300 text-xs">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {suggestedCommand && (
              <div className="flex items-center gap-2 bg-purple-950/40 border border-purple-500/40 px-3 py-1.5 rounded-xl animate-fadeIn">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-purple-300 font-bold uppercase tracking-wider shrink-0">
                      ✨ AI Suggested:
                    </span>
                    <code className="text-xs font-mono text-emerald-400 font-bold truncate max-w-xs md:max-w-md">
                      {suggestedCommand}
                    </code>
                  </div>
                  {aiExplanation && (
                    <span className="text-[10px] text-slate-400 truncate max-w-md">
                      {aiExplanation}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleRunCommand(suggestedCommand)}
                  disabled={isExecuting}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0 ml-1"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run Now</span>
                </button>
              </div>
            )}
          </div>

          {/* Terminal Screen Body + Side AI Copilot Drawer */}
          <div className="flex-1 flex min-h-0 overflow-hidden relative">
            
            {/* Main Terminal Screen */}
            <div 
              onClick={() => inputRef.current?.focus()}
              className="p-4 flex-1 overflow-y-auto font-mono text-xs leading-relaxed space-y-3 bg-[#03060f] cursor-text"
            >
              <div className="text-slate-500 text-[11px] pb-2 border-b border-slate-900">
                Connected to <b>{serverUser}@{serverHost}</b>. Type shell commands directly below or use AI Copilot solver above. Type <b className="text-blue-400">help</b> for instructions, <b className="text-blue-400">clear</b> to clear.
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

            {/* Right Side Collapsible AI Problem-to-Command Solver Drawer */}
            <AnimatePresence>
              {showAiCopilot && (
                <motion.div
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 300, opacity: 0 }}
                  className="w-80 border-l border-slate-800 bg-[#090e1c] flex flex-col h-full font-sans text-xs overflow-y-auto shrink-0 shadow-2xl p-4 space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2 font-bold text-slate-200 text-xs">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span>Problem ➔ Command Solver</span>
                    </div>
                    <button onClick={() => setShowAiCopilot(false)} className="text-slate-500 hover:text-slate-300">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Click any problem below to automatically generate and execute the exact shell command on <b>{serverUser}@{serverHost}</b>:
                  </p>

                  <div className="space-y-2.5">
                    {PROBLEM_COMMAND_DATABASE.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleRunCommand(item.command)}
                        className="p-3 rounded-xl card-bg-subtle border border-slate-800 hover:border-purple-500/50 transition cursor-pointer group space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[11px] text-purple-300 group-hover:text-purple-200">
                            {item.problem}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
                            {item.category}
                          </span>
                        </div>
                        <code className="text-[10px] font-mono text-emerald-400 block truncate font-bold">
                          {item.command}
                        </code>
                        <p className="text-[10px] text-slate-400">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
