import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  projectId?: string;
  serverHost?: string;
  serverUser?: string;
}

interface CommandHistoryItem {
  id: string;
  command: string;
  output: string;
  exitCode: number;
  time: string;
  cwd?: string;
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

interface SecurityRiskResult {
  isDangerous: boolean;
  threatLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  title: string;
  reason: string;
  recommendation: string;
}

const checkCommandSecurityRisk = (cmd: string): SecurityRiskResult | null => {
  const c = cmd.toLowerCase().trim();

  // 1. File System Destruction
  if (c.includes('rm -rf') || c.includes('rm -r /') || c.includes('rm -rf /') || c.includes('rm -f /') || c.includes('rm -rf *') || c.includes('rm -rf ~')) {
    return {
      isDangerous: true,
      threatLevel: 'CRITICAL',
      title: '🚨 Catastrophic File System Deletion Blocked',
      reason: 'This command performs unrecoverable recursive file deletion across server directories.',
      recommendation: 'Use targeted file removal e.g. "rm filename" or inspect directories first with "ls -la".'
    };
  }

  // 2. Server Shutdown or Reboot
  if (c === 'reboot' || c === 'shutdown' || c.includes('shutdown -h') || c.includes('init 0') || c.includes('poweroff') || c.includes('halt')) {
    return {
      isDangerous: true,
      threatLevel: 'CRITICAL',
      title: '⚠️ Remote Server Shutdown / Reboot Intercepted',
      reason: 'Executing shutdown or reboot will immediately kill all production workloads and terminate SSH access.',
      recommendation: 'If restarting a service, use "sudo docker restart <container>" or "sudo systemctl restart <service>".'
    };
  }

  // 3. Disk Formatting / Wipe
  if (c.includes('mkfs') || c.includes('dd if=') || c.includes('fdisk') || c.includes('parted')) {
    return {
      isDangerous: true,
      threatLevel: 'CRITICAL',
      title: '🚨 Disk Partition Wipe / Format Intercepted',
      reason: 'Disk formatting operations overwrite partition block tables causing total data loss.',
      recommendation: 'Inspect disk storage safely with "df -h" or "lsblk".'
    };
  }

  // 4. System Permission Corruption
  if (c.includes('chmod -r 777') || c.includes('chmod -r 000') || c.includes('chown -r root /')) {
    return {
      isDangerous: true,
      threatLevel: 'HIGH',
      title: '⚠️ System Permission Corruption Intercepted',
      reason: 'Recursive permission modification on root "/" corrupts Linux security policies and breaks SSH login.',
      recommendation: 'Apply file permissions strictly to specific target application folders.'
    };
  }

  // 5. Mass Docker Destruction
  if (c.includes('docker system prune -a') || c.includes('docker volume prune') || c.includes('docker kill $(docker ps')) {
    return {
      isDangerous: true,
      threatLevel: 'HIGH',
      title: '⚡ Mass Docker Container & Volume Destruction Intercepted',
      reason: 'This command forcefully terminates and wipes all Docker containers, images, and persistent database volumes.',
      recommendation: 'Stop or inspect individual containers using "sudo docker stop <name>" or "sudo docker ps".'
    };
  }

  // 6. Security Firewall Deactivation
  if (c.includes('iptables -f') || c.includes('ufw disable') || c.includes('systemctl stop firewalld')) {
    return {
      isDangerous: true,
      threatLevel: 'HIGH',
      title: '🛡️ Firewall Security Deactivation Intercepted',
      reason: 'Disabling firewall rules exposes all internal server ports to unauthorized external intrusion.',
      recommendation: 'Inspect active firewall rules safely with "sudo ufw status" or "sudo iptables -L".'
    };
  }

  // 7. Fork Bomb
  if (c.includes(':(){ :|:& };:') || c.includes('fork bomb')) {
    return {
      isDangerous: true,
      threatLevel: 'CRITICAL',
      title: '💣 Malicious Fork Bomb Execution Intercepted',
      reason: 'Fork bombs exhaust all system CPU process IDs forcing kernel panic and freeze.',
      recommendation: 'Command execution has been permanently blocked.'
    };
  }

  return null;
};

const stripAnsi = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '')
    .replace(/[\u001b\u009b]\[[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
    .replace(/\x1B\([B0K]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
};

export const ServerTerminalModal: React.FC<ServerTerminalModalProps> = ({ 
  isOpen, 
  onClose, 
  projectId,
  serverHost = '',
  serverUser = 'ubuntu'
}) => {
  const [commandInput, setCommandInput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executingCmd, setExecutingCmd] = useState<string>('');
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [showAiCopilot, setShowAiCopilot] = useState<boolean>(false);
  const [aiProblemQuery, setAiProblemQuery] = useState<string>('');
  const [suggestedCommand, setSuggestedCommand] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (val: string) => {
    setAiProblemQuery(val);
    const trimmed = val.trim();
    
    if (!trimmed) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      setIsTyping(false);
      setIsAiThinking(false);
      setSuggestedCommand('');
      setAiExplanation('');
      return;
    }

    setIsTyping(true);
    setIsAiThinking(true);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsTyping(false);
      try {
        const res = await suggestAICommandApi(trimmed, serverHost, serverUser);
        if (res && res.command) {
          setSuggestedCommand(res.command);
          setAiExplanation(res.explanation || '');
        }
      } catch (e) {
        const q = trimmed.toLowerCase();
        if (q.includes('docker') && (q.includes('error') || q.includes('log'))) {
          setSuggestedCommand(`for c in $(sudo docker ps --format '{{.Names}}'); do echo "=== CONTAINER: $c ==="; sudo docker logs --tail 25 $c 2>&1 | grep -i -E "error|warn|fail|exception" || echo "No recent errors"; done`);
          setAiExplanation('Scans and filters error, warning & exception logs across all active Docker containers');
        } else if (q.includes('setup') || q.includes('system') || q.includes('server') || q.includes('kya h')) {
          setSuggestedCommand('uname -a && uptime && sudo docker ps');
          setAiExplanation('Displays OS kernel details, server uptime & load, and all active Docker containers');
        } else {
          setSuggestedCommand('sudo docker ps');
          setAiExplanation('Lists active Docker containers on remote host');
        }
      } finally {
        setIsAiThinking(false);
      }
    }, 600);
  };
  const [currentDir, setCurrentDir] = useState<string>('~');
  const [history, setHistory] = useState<CommandHistoryItem[]>([
    {
      id: 'init-1',
      command: 'opspilot --version',
      output: 'D-OpsPilot Real-Time Server SSH Shell v1.0.0 (Connected via AES-256 WebCrypto Vault)',
      exitCode: 0,
      time: new Date().toTimeString().split(' ')[0],
      cwd: '~'
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

  const [pendingDangerousCmd, setPendingDangerousCmd] = useState<string>('');
  const [securityRiskAlert, setSecurityRiskAlert] = useState<SecurityRiskResult | null>(null);
  const [confirmInput, setConfirmInput] = useState<string>('');

  const handleRunCommand = async (cmdToRun?: string, forceExecute = false) => {
    const targetCmd = (cmdToRun || commandInput).trim();
    if (!targetCmd || isExecuting) return;

    if (!forceExecute) {
      const risk = checkCommandSecurityRisk(targetCmd);
      if (risk && risk.isDangerous) {
        setPendingDangerousCmd(targetCmd);
        setSecurityRiskAlert(risk);
        setConfirmInput('');
        return;
      }
    }

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
          output: `Available Quick Shell Commands:\n  - docker ps                 (Inspect container states)\n  - curl http://localhost:8080/health (Check HTTP proxy status)\n  - free -m                   (Inspect RAM memory allocation)\n  - uptime                    (Check server load average)\n  - git status                (Check git working tree)\n  - ls -la                    (List directory contents)\n  - cd <folder>               (Change working directory)\n  - clear                     (Clear terminal screen)`,
          exitCode: 0,
          time: timeStr,
          cwd: currentDir
        }
      ]);
      setCommandInput('');
      return;
    }

    if (targetCmd.toLowerCase() === 'history') {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const historyOutput = cmdHistoryList.length
        ? cmdHistoryList.map((cmd, index) => `${index + 1}  ${cmd}`).join('\n')
        : 'No commands have been run in this terminal session yet.';
      setHistory(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          command: 'history',
          output: historyOutput,
          exitCode: 0,
          time: timeStr,
          cwd: currentDir
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

      // Special handling for cd command to track working directory state
      let execCmd = targetCmd;
      let isCdCommand = targetCmd.startsWith('cd ') || targetCmd === 'cd' || targetCmd === 'cd ~' || targetCmd === 'cd ..';
      if (isCdCommand) {
        execCmd = `${targetCmd} && pwd`;
      }

      const res = await executeCommandOnServer(execCmd, projectId, currentDir);
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      let displayOutput = stripAnsi(res.output);

      if (isCdCommand && res.exitCode === 0) {
        const lines = (displayOutput || '').trim().split('\n');
        const pwdResult = lines[lines.length - 1]?.trim();
        if (pwdResult && (pwdResult.startsWith('/') || pwdResult.startsWith('~'))) {
          setCurrentDir(pwdResult);
          displayOutput = `Changed directory to ${pwdResult}`;
        } else if (!displayOutput || displayOutput.includes('Command executed successfully')) {
          displayOutput = `Changed working directory`;
        }
      } else if (!displayOutput || displayOutput.trim() === '') {
        displayOutput = `(Command executed successfully)`;
      }

      setHistory(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          command: targetCmd,
          output: displayOutput,
          exitCode: res.exitCode,
          time: timeStr,
          cwd: currentDir
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
          time: timeStr,
          cwd: currentDir
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

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-900/35 dark:bg-black/70 backdrop-blur-md flex items-start justify-center p-3"
        >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className={`glass-panel w-full rounded-2xl border theme-border bg-white shadow-2xl flex flex-col overflow-hidden font-sans transition-all duration-300 dark:border-slate-800 dark:bg-[#050811] ${
            isMaximized ? 'h-[calc(100vh-1.5rem)] max-w-[98vw]' : 'h-[min(760px,calc(100vh-1.5rem))] max-w-5xl'
          }`}
        >
          {/* Top Window Bar */}
          <div className="px-4 py-3 bg-slate-50 border-b theme-border flex items-center justify-between font-mono text-xs select-none dark:bg-[#0a0f1d] dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block cursor-pointer hover:opacity-80 transition" onClick={onClose} title="Close Terminal" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block cursor-pointer hover:opacity-80 transition" onClick={() => setIsMaximized(!isMaximized)} title="Maximize/Restore" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-title font-bold truncate">
                {serverUser}@{serverHost} <span className="text-subtitle font-normal text-[10px] hidden sm:inline">(Interactive Remote SSH Terminal)</span>
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowAiCopilot(!showAiCopilot)}
                className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer border ${
                  showAiCopilot
                    ? 'bg-purple-600 text-white border-purple-500 shadow-md glow-blue'
                    : 'bg-purple-500/10 text-purple-700 border-purple-500/30 hover:bg-purple-500/20 dark:text-purple-400'
                }`}
                title="Toggle AI Command Copilot Drawer"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400 fill-current animate-pulse" />
                <span>AI Copilot</span>
              </button>

              <span className="hidden lg:flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold font-mono">
                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> WebCrypto Encrypted
              </span>

              <button
                onClick={handleCopyLogs}
                className="p-1.5 rounded-lg card-bg-subtle border theme-border text-subtitle hover:text-title transition flex items-center gap-1 text-[11px] dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-white"
                title="Copy Terminal Log"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={() => setHistory([])}
                className="p-1.5 rounded-lg card-bg-subtle border theme-border text-subtitle hover:text-rose-500 transition dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-rose-400"
                title="Clear Terminal Output"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-1.5 rounded-lg card-bg-subtle border theme-border text-subtitle hover:text-title transition dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-white"
                title={isMaximized ? 'Minimize' : 'Maximize'}
              >
                {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg card-bg-subtle border theme-border text-subtitle hover:text-title transition dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-white dark:hover:border-slate-700"
                title="Close Window"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Preset Command Pills Toolbar */}
          <div className="px-4 py-2 bg-slate-100/80 border-b theme-border flex items-center justify-between gap-3 select-none font-mono text-[10px] dark:bg-slate-950/80 dark:border-slate-900">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-slate-700 dark:text-slate-500 shrink-0 font-bold">Quick Presets:</span>
              {presetCommands.map(cmd => (
                <button
                  key={cmd}
                  onClick={() => handleRunCommand(cmd)}
                  disabled={isExecuting}
                  className="px-2.5 py-1 rounded-md bg-white hover:bg-blue-600 hover:text-white text-slate-700 border theme-border transition shrink-0 cursor-pointer font-bold flex items-center gap-1 shadow-sm dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
                >
                  <Play className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 fill-current" />
                  <span>{cmd}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAiCopilot(!showAiCopilot)}
              className="text-purple-700 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-bold flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Lightbulb className="w-3 h-3 text-purple-700 dark:text-purple-400" />
              <span>{showAiCopilot ? 'Hide AI Solver Drawer' : 'Problem ➔ Command Assistant'}</span>
            </button>
          </div>

          {/* AI Natural Language Problem ➔ Command Solver Input Bar */}
          <div className="px-4 py-2.5 bg-white border-b theme-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 dark:bg-[#080d1a] dark:border-slate-800/80">
            <div className="flex items-center gap-2 flex-1 card-bg-subtle px-3 py-1.5 rounded-xl border border-purple-500/30">
              <Sparkles className="w-4 h-4 text-purple-700 dark:text-purple-400 shrink-0 animate-pulse" />
              <input
                type="text"
                value={aiProblemQuery}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Ask AI Copilot in Hindi/English (e.g. 'error log in docker', 'mera server setup kya h')..."
                className="w-full bg-transparent text-xs text-title placeholder-slate-500 focus:outline-none font-sans dark:text-slate-100 dark:placeholder-slate-500"
              />
              {(isTyping || isAiThinking) && (
                <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400 font-mono text-[10px] shrink-0 font-bold animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-700 dark:text-purple-400" />
                  <span>{isTyping ? 'Waiting for typing complete...' : 'AI Thinking & Analyzing...'}</span>
                </div>
              )}
              {aiProblemQuery && !isTyping && !isAiThinking && (
                <button onClick={() => { setAiProblemQuery(''); setSuggestedCommand(''); setAiExplanation(''); }} className="text-subtitle hover:text-title text-xs dark:text-slate-500 dark:hover:text-slate-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {suggestedCommand && (
              <div className="flex items-center gap-2 bg-purple-950/40 border border-purple-500/40 px-3 py-1.5 rounded-xl animate-fadeIn">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-purple-700 dark:text-purple-300 font-bold uppercase tracking-wider shrink-0">
                      ✨ AI Suggested:
                    </span>
                    <code className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-xs md:max-w-md">
                      {suggestedCommand}
                    </code>
                  </div>
                  {aiExplanation && (
                    <span className="text-[10px] text-subtitle truncate max-w-md dark:text-slate-400">
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
              className="p-4 flex-1 overflow-y-auto font-mono text-xs leading-relaxed space-y-3 bg-white cursor-text dark:bg-[#03060f]"
            >
              <div className="text-slate-700 text-[11px] pb-2 border-b theme-border dark:text-slate-500 dark:border-slate-900">
                Connected to <b>{serverUser}@{serverHost}</b>. Type shell commands directly below or use AI Copilot solver above. Type <b className="text-blue-400">help</b> for instructions, <b className="text-blue-400">clear</b> to clear.
              </div>

              {history.map((item) => (
                <div key={item.id} className="space-y-1">
                  {/* Command Line Prompt */}
                  <div className="flex items-center gap-2 text-slate-700 flex-wrap dark:text-slate-300">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{serverUser}@{serverHost}:{item.cwd || '~'}$</span>
                    <span className="text-title font-bold">{item.command}</span>
                    <span className="text-[10px] text-subtitle font-mono ml-auto dark:text-slate-600">[{item.time}]</span>
                  </div>

                  {/* Command Output */}
                  <pre className={`p-3 rounded-lg text-[11px] overflow-x-auto border font-mono whitespace-pre-wrap leading-relaxed ${
                    item.exitCode === 0
                      ? 'bg-slate-50 text-title border-slate-200 shadow-inner dark:bg-slate-950/90 dark:text-slate-200 dark:border-slate-900'
                      : 'bg-rose-950/30 text-rose-300 border-rose-900/50 shadow-inner'
                  }`}>
                    {stripAnsi(item.output)}
                  </pre>
                </div>
              ))}

              {/* Glowing Thinking & Execution Loader Block */}
              {isExecuting && (
                <div className="space-y-1.5 animate-pulse my-2">
                  <div className="flex items-center gap-2 text-slate-700 font-mono text-xs dark:text-slate-300">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{serverUser}@{serverHost}:{currentDir}$</span>
                    <span className="text-blue-700 dark:text-blue-400 font-bold">{executingCmd || commandInput}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-300 text-blue-900 font-mono text-xs flex items-center gap-3 shadow-lg shadow-blue-100 dark:bg-blue-950/40 dark:border-blue-500/40 dark:text-blue-300 dark:shadow-none dark:glow-blue">
                    <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-extrabold text-blue-700 dark:text-blue-400 tracking-wide uppercase text-[10px] block">
                        ⚡ SSH COMMAND EXECUTING ON REMOTE SERVER...
                      </span>
                      <span className="text-slate-800 text-[11px] font-semibold dark:text-slate-200">
                        Thinking & Fetching live response from <b className="text-blue-700 dark:text-blue-300 font-bold">{serverUser}@{serverHost}</b>...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Live Active Command Input Line */}
              <div className="flex items-center gap-2 pt-2 text-title font-mono dark:text-slate-200">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">{serverUser}@{serverHost}:{currentDir}$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={commandInput}
                  disabled={isExecuting}
                  onChange={(e) => setCommandInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isExecuting ? 'Executing command on server...' : 'Type command (e.g. docker ps)...'}
                  className="flex-1 bg-transparent text-title font-mono text-xs focus:outline-none border-none placeholder-slate-600 dark:text-slate-100 dark:placeholder-slate-600"
                />
                {isExecuting ? (
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                ) : (
                  <button
                    onClick={() => handleRunCommand()}
                    className="p-1 text-subtitle hover:text-emerald-500 transition dark:text-slate-400 dark:hover:text-emerald-400"
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
                  className="w-80 border-l theme-border bg-slate-50 flex flex-col h-full font-sans text-xs overflow-y-auto shrink-0 shadow-2xl p-4 space-y-4 dark:border-slate-800 dark:bg-[#090e1c]"
                >
                  <div className="flex items-center justify-between pb-3 border-b theme-border dark:border-slate-800">
                    <div className="flex items-center gap-2 font-bold text-title text-xs dark:text-slate-200">
                      <Sparkles className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                      <span>Problem ➔ Command Solver</span>
                    </div>
                    <button onClick={() => setShowAiCopilot(false)} className="text-subtitle hover:text-title dark:text-slate-500 dark:hover:text-slate-300">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-700 leading-relaxed dark:text-slate-400">
                    Click any problem below to automatically generate and execute the exact shell command on <b>{serverUser}@{serverHost}</b>:
                  </p>

                  <div className="space-y-2.5">
                    {PROBLEM_COMMAND_DATABASE.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleRunCommand(item.command)}
                        className="p-3 rounded-xl card-bg-subtle border theme-border hover:border-purple-500/50 transition cursor-pointer group space-y-1.5 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[11px] text-purple-700 group-hover:text-purple-800 dark:text-purple-300 dark:group-hover:text-purple-200">
                            {item.problem}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20 font-bold">
                            {item.category}
                          </span>
                        </div>
                        <code className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 block truncate font-bold">
                          {item.command}
                        </code>
                        <p className="text-[10px] text-slate-700 dark:text-slate-400">
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

      {/* Dangerous Command Security Intercept Modal */}
      <AnimatePresence>
        {securityRiskAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/35 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-panel w-full max-w-lg rounded-2xl border border-rose-500/40 bg-white shadow-2xl p-6 space-y-5 text-title font-sans dark:border-rose-500/50 dark:bg-[#0c0406] dark:text-slate-100"
            >
              <div className="flex items-start justify-between border-b border-rose-900/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                    <ShieldCheck className="w-6 h-6 text-rose-500 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-extrabold text-rose-400 tracking-wider uppercase block">
                      SECURITY SHIELD INTERCEPT
                    </span>
                    <h3 className="font-extrabold text-base text-rose-200">
                      {securityRiskAlert.title}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => { setSecurityRiskAlert(null); setPendingDangerousCmd(''); }}
                  className="text-subtitle hover:text-title transition dark:text-slate-500 dark:hover:text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 border theme-border font-mono text-xs space-y-1 dark:bg-slate-950/80 dark:border-slate-800">
                  <span className="text-[10px] text-subtitle font-bold uppercase block dark:text-slate-500">Target Command Attempted:</span>
                  <code className="text-rose-400 font-bold text-xs break-all block">
                    {pendingDangerousCmd}
                  </code>
                </div>

                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/50 text-xs text-rose-200 space-y-1">
                  <span className="font-bold text-rose-400 block uppercase text-[10px]">Threat & Security Assessment:</span>
                  <p className="leading-relaxed">{securityRiskAlert.reason}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-400/50 text-xs text-amber-800 space-y-2 font-mono dark:bg-amber-950/30 dark:border-amber-500/40 dark:text-amber-200">
                  <span className="font-extrabold text-amber-400 block uppercase text-[10px] tracking-wide">
                    🔐 ZERO-TRUST DIRECTIVE: NATIVE SERVER LOGIN REQUIRED
                  </span>
                  <p className="text-[11px] text-subtitle font-sans leading-relaxed dark:text-slate-300">
                    D-OpsPilot AI web interface prohibits running destructive commands directly via API. To execute this dangerous command on <b>{serverUser}@{serverHost}</b>, please open your native terminal and log in directly:
                  </p>
                  
                  <div className="p-2.5 rounded-lg bg-white border border-amber-400/40 text-amber-700 font-mono text-xs flex items-center justify-between gap-2 dark:bg-black dark:border-amber-500/30 dark:text-amber-300">
                    <code className="truncate font-bold">
                      ssh -i ~/.ssh/id_rsa_no_pass {serverUser}@{serverHost}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`ssh -i ~/.ssh/id_rsa_no_pass ${serverUser}@${serverHost}`);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold transition shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied SSH Cmd' : 'Copy SSH Cmd'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => { setSecurityRiskAlert(null); setPendingDangerousCmd(''); }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Acknowledge & Close (Use Native Terminal SSH Instead)</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
};
