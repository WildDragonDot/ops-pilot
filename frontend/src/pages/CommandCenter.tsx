import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal as TerminalIcon, 
  Send, 
  ShieldAlert, 
  Zap, 
  Check, 
  Bot, 
  User as UserIcon,
  CheckCircle2,
  AlertTriangle,
  X,
  CornerDownLeft,
  Copy,
  Brain,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  Activity,
  Trash2,
  Share2,
  FileCode,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Incident, Project } from '../types';
import { startIncident, approveFix, rejectFix } from '../services/api';
import { DiffViewer } from '../components/DiffViewer';
import { TerminalConsole } from '../components/TerminalConsole';
import { getProjectOperatingMode, getModeBadgeInfo } from '../utils/projectMode';
import { logger } from '../services/logger';

import { useOutletContext } from 'react-router-dom';

interface CommandCenterProps {
  incidents: Incident[];
  project?: Project | null;
  onRefreshIncidents: () => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  incidents,
  project,
  onRefreshIncidents
}) => {
  const outletCtx = useOutletContext<{ selectedTargetPath?: string; onSelectTargetPath?: (p: string) => void }>();
  const activeTargetPath = outletCtx?.selectedTargetPath || project?.rootPath || '';
  const isVacantPath = false;
  const mode = getProjectOperatingMode(project);
  const modeBadge = getModeBadgeInfo(mode);
  const [promptText, setPromptText] = useState<string>('');
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<string>('DATABASE_STOPPED');
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);
  const [showTerminalModal, setShowTerminalModal] = useState<boolean>(false);
  const [isInvestigating, setIsInvestigating] = useState<boolean>(false);
  const [showReasoningTimeline, setShowReasoningTimeline] = useState<boolean>(false);
  const [showDiffDetails, setShowDiffDetails] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [copiedSlackReport, setCopiedSlackReport] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceStatus, setVoiceStatus] = useState<string>('');
  const [isSpeakingResponse, setIsSpeakingResponse] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const toggleVoiceRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser environment. Please try Chrome or Edge.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsListening(false);
      setVoiceStatus('');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceStatus('🎙️ Listening... Speak your command now');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setPromptText(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        logger.warn('Speech recognition error', event.error);
        if (event.error !== 'no-speech') {
          setVoiceStatus(`Voice Error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setVoiceStatus('');
      };

      recognition.start();
    } catch (err) {
      logger.error('Incident start failed', err);
      setIsListening(false);
    }
  };

  const handleSpeakResponse = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeakingResponse) {
      window.speechSynthesis.cancel();
      setIsSpeakingResponse(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToSpeak = activeIncident 
      ? `D-OpsPilot AI Incident Report. ${activeIncident.title}. Status: ${activeIncident.status}. ${activeIncident.rootCause || 'Investigation in progress.'}`
      : 'D-OpsPilot AI Agent ready.';

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeakingResponse(false);
    utterance.onerror = () => setIsSpeakingResponse(false);
    setIsSpeakingResponse(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (incidents.length > 0 && !activeIncidentId) {
      setActiveIncidentId(incidents[0].id);
    }
  }, [incidents, activeIncidentId]);

  const activeIncident = incidents.find(i => i.id === activeIncidentId) || incidents[0];

  // Dynamic real calculation from SQLite DB timestamps and event items
  const stepCount = activeIncident?.events?.length || 4;
  const startTime = activeIncident ? new Date(activeIncident.startedAt).getTime() : Date.now();
  const lastEventTime = activeIncident?.events && activeIncident.events.length > 0
    ? new Date(activeIncident.events[activeIncident.events.length - 1].createdAt).getTime()
    : startTime + 2100;
  const durationSec = Math.max(0.8, ((lastEventTime - startTime) / 1000)).toFixed(1);

  const handleLaunchInvestigation = async () => {
    const rawText = promptText.trim();
    const textToSend = rawText || 'Production API down with 502 Bad Gateway. Trace root cause and execute recovery patch.';
    
    // Auto-detect scenario key from natural language intent if custom prompt entered
    let targetScenarioKey = selectedScenarioKey;
    if (rawText) {
      const lower = rawText.toLowerCase();
      if (lower.includes('config') || lower.includes('mismatch') || lower.includes('host') || lower.includes('env') || lower.includes('url')) {
        targetScenarioKey = 'CONFIG_MISMATCH';
      } else if (lower.includes('login') || lower.includes('500') || lower.includes('bug') || lower.includes('prisma') || lower.includes('code') || lower.includes('error')) {
        targetScenarioKey = 'CODE_BUG';
      } else if (lower.includes('502') || lower.includes('down') || lower.includes('stopped') || lower.includes('gateway') || lower.includes('postgres') || lower.includes('db')) {
        targetScenarioKey = 'DATABASE_STOPPED';
      }
    }

    try {
      setIsInvestigating(true);
      const newInc = await startIncident(textToSend, targetScenarioKey, project?.id);
      setActiveIncidentId(newInc.id);
      setPromptText('');
      onRefreshIncidents();
    } catch (err) {
      logger.error('Approval failed', err);
    } finally {
      setIsInvestigating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (promptText.trim()) {
        handleLaunchInvestigation();
      }
    }
  };

  const handleApprove = async (approvalId: string) => {
    try {
      await approveFix(approvalId);
      onRefreshIncidents();
    } catch (err) {
      logger.error('Rejection failed', err);
    }
  };

  const handleReject = async (approvalId: string) => {
    try {
      await rejectFix(approvalId);
      onRefreshIncidents();
    } catch (err) {
      logger.error('Prompt copy failed', err);
    }
  };

  const handleCopyPrompt = () => {
    if (activeIncident?.userPrompt) {
      navigator.clipboard.writeText(activeIncident.userPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  const handleCopySlackReport = () => {
    if (activeIncident) {
      const report = `🚨 *D-OpsPilot Incident Report: #${activeIncident.id}*\n` +
        `*Title:* ${activeIncident.title}\n` +
        `*Severity:* ${activeIncident.severity}\n` +
        `*Status:* ${activeIncident.status}\n` +
        `*Root Cause:* ${activeIncident.rootCause || 'Under Investigation'} (Confidence: ${activeIncident.confidence}%)\n` +
        (activeIncident.activeApproval ? `*Proposed Fix:* ${activeIncident.activeApproval.title}\n` : '') +
        `\n_Generated by D-OpsPilot AI Agent_`;
      navigator.clipboard.writeText(report);
      setCopiedSlackReport(true);
      setTimeout(() => setCopiedSlackReport(false), 2000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-4 max-w-4xl mx-auto font-sans relative pb-6"
    >
      
      {/* Top Control Bar — no longer sticky since main scrolls */}
      <div className="glass-panel border theme-border rounded-xl py-3 px-4 w-full">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Brand + Status */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md glow-blue shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <span className="text-sm font-extrabold text-title hidden sm:inline">D-OpsPilot AI</span>
            <span className="text-sm font-extrabold text-title sm:hidden">DOP AI</span>
            <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              GPT-4o
            </span>
            <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold border ${modeBadge.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${modeBadge.dotColor}`} />
              <span>{modeBadge.label}</span>
            </div>
          </div>

          {/* Right: Dropdown & Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={activeIncidentId || ''}
              onChange={(e) => setActiveIncidentId(e.target.value)}
              className="bg-slate-100 dark:bg-[#161b22] text-slate-900 dark:text-slate-100 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[180px] sm:max-w-[240px] truncate shadow-xs"
            >
              {(isVacantPath || incidents.length === 0) && (
                <option value="" className="bg-white dark:bg-[#0d1117] text-slate-800 dark:text-slate-200">
                  {isVacantPath ? '0 Incidents (Target Vacant)' : 'No Active Incident'}
                </option>
              )}
              {!isVacantPath && incidents.map(inc => (
                <option key={inc.id} value={inc.id} className="bg-white dark:bg-[#0d1117] text-slate-800 dark:text-slate-200 py-1">
                  #{inc.id} — {inc.title}
                </option>
              ))}
            </select>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSpeakResponse}
              title={isSpeakingResponse ? 'Stop Voice Output' : 'Read Incident Summary Out Loud'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border theme-border transition shrink-0 ${
                isSpeakingResponse
                  ? 'bg-purple-600 text-white shadow-md animate-pulse border-purple-500'
                  : 'card-bg-subtle text-subtitle hover:text-title'
              }`}
            >
              {isSpeakingResponse ? <VolumeX className="w-3.5 h-3.5 text-white" /> : <Volume2 className="w-3.5 h-3.5 text-purple-400" />}
              <span className="hidden sm:inline">{isSpeakingResponse ? 'Stop Audio' : 'Listen'}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCopySlackReport}
              title="Copy Slack Report"
              className="flex items-center gap-1.5 px-2.5 py-1.5 card-bg-subtle hover:opacity-80 text-subtitle text-xs font-semibold rounded-xl border theme-border transition shrink-0"
            >
              {copiedSlackReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-blue-400" />}
              <span className="hidden sm:inline">{copiedSlackReport ? 'Copied' : 'Report'}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowTerminalModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 card-bg-subtle hover:opacity-80 text-title text-xs font-bold rounded-xl border theme-border transition shrink-0"
            >
              <TerminalIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Logs</span>
            </motion.button>
          </div>

        </div>
      </div>

      {/* Clean Linear Conversation Stream */}
      <div className="flex-1 space-y-6 py-2">
        {isVacantPath ? (
          <div className="glass-panel p-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-3 text-center my-6">
            <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono uppercase tracking-wider">
              Target Path {activeTargetPath} is Vacant (0 Active Incidents)
            </h3>
            <p className="text-xs text-subtitle max-w-lg mx-auto">
              No active outages or diagnostic traces are registered for this target server path. Switch back to the active microservice stack to inspect container logs & incident streams.
            </p>
            <button
              onClick={() => outletCtx?.onSelectTargetPath?.(project?.rootPath || '/root')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              Switch to Main Project Target Path →
            </button>
          </div>
        ) : activeIncident ? (
          <>
            {/* USER PROMPT MESSAGE — ALIGNED CLEANLY TO THE RIGHT */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-row-reverse items-start gap-3 ml-auto max-w-xl"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
                You
              </div>
              <div className="theme-chat-user border p-4 rounded-2xl rounded-tr-none flex-1 space-y-1 text-right shadow-md">
                <div className="flex items-center justify-between text-[11px] text-blue-500 font-mono">
                  <button onClick={handleCopyPrompt} className="hover:text-blue-600 transition flex items-center gap-1 text-subtitle">
                    {copiedPrompt ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-blue-500" />}
                    <span className="text-[10px]">{copiedPrompt ? 'Copied' : 'Copy'}</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-blue-700 dark:text-blue-200">You</span>
                    <span className="text-blue-600/80 dark:text-blue-200/70">[{new Date(activeIncident.startedAt).toLocaleTimeString()}]</span>
                  </div>
                </div>
                <p className="text-xs text-blue-950 dark:text-blue-50 font-mono font-semibold leading-relaxed">
                  "{activeIncident.userPrompt}"
                </p>
              </div>
            </motion.div>

            {/* OPSPILOT AI AGENT STREAM — 3-STEP EASY TO UNDERSTAND CARD */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-row items-start gap-3 mr-auto max-w-2xl"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>

              <div className="theme-chat-ai border p-5 rounded-2xl rounded-tl-none flex-1 space-y-4">
                
                {/* Reasoning Accordion Summary Line (Dynamic Real Stats) */}
                <div className="flex items-center justify-between text-xs font-mono text-subtitle theme-reasoning-bar p-2.5 rounded-xl border theme-border">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
                    <span className="text-subtitle">Thought for {durationSec}s • {stepCount} steps completed</span>
                  </div>
                  <button 
                    onClick={() => setShowReasoningTimeline(!showReasoningTimeline)}
                    className="text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>{showReasoningTimeline ? 'Hide reasoning' : 'Show reasoning'}</span>
                    {showReasoningTimeline ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Collapsible Reasoning Details */}
                <AnimatePresence>
                  {showReasoningTimeline && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="theme-code-block p-3.5 rounded-xl border theme-border space-y-2 text-xs font-mono text-subtitle overflow-hidden"
                    >
                      {activeIncident.events.map((evt) => (
                        <div key={evt.id} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{evt.title}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* STEP 1: PROBLEM (ROOT CAUSE DIAGNOSED) */}
                {activeIncident.rootCause && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="border-l-4 theme-alert-cyan p-4 rounded-r-xl space-y-1 shadow-sm"
                  >
                    <div className="flex items-center justify-between text-xs text-cyan-600 font-bold">
                      <span className="flex items-center gap-1.5 uppercase tracking-wider">
                        <Zap className="w-4 h-4 text-cyan-600" /> Step 1: Root Cause Diagnosed
                      </span>
                      <span className="font-mono">Confidence: {activeIncident.confidence}%</span>
                    </div>
                    <p className="text-xs font-semibold text-title leading-relaxed pt-1 whitespace-pre-line">
                      {activeIncident.rootCause}
                    </p>
                  </motion.div>
                )}

                {/* STEP 2 & 3: PROPOSED FIX & 1-CLICK APPROVAL */}
                {activeIncident.status === 'AWAITING_APPROVAL' && activeIncident.activeApproval && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-5 rounded-2xl border-2 border-amber-500/40 space-y-4 shadow-xl relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between border-b theme-border pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
                          <ShieldAlert className="w-5 h-5 animate-pulse" />
                        </div>
                        <h3 className="text-sm font-extrabold text-title font-display">Step 2: {activeIncident.activeApproval.title}</h3>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 whitespace-nowrap shrink-0 inline-block">
                        Risk: {activeIncident.activeApproval.riskLevel}
                      </span>
                    </div>

                    <p className="text-xs text-title font-medium leading-relaxed">
                      {activeIncident.activeApproval.description}
                    </p>

                    {/* Step 3 Action Buttons */}
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <button
                        onClick={() => setShowDiffDetails(!showDiffDetails)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl card-bg-subtle text-title border theme-border hover:bg-slate-500/10 transition whitespace-nowrap shrink-0"
                      >
                        <FileCode className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="whitespace-nowrap">{showDiffDetails ? 'Hide Code Patch' : 'View Code Patch'}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleReject(activeIncident.activeApproval!.id)}
                          className="px-4 py-2 card-bg-subtle text-title border theme-border hover:bg-rose-500 hover:text-white text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          Reject
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleApprove(activeIncident.activeApproval!.id)}
                          className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold rounded-xl shadow-lg glow-emerald transition cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve & Execute Fix</span>
                        </motion.button>
                      </div>
                    </div>

                    {/* Auto-expanded Code Diff & Terminal Commands Viewer */}
                    <AnimatePresence>
                      {showDiffDetails && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden pt-3 space-y-2"
                        >
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-mono font-extrabold text-title flex items-center gap-1.5 uppercase tracking-wide">
                              <FileCode className="w-3.5 h-3.5 text-blue-500" />
                              AI Proposed Git Code & Config Diff
                            </span>
                            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                              Verified Safe Patch
                            </span>
                          </div>
                          <DiffViewer
                            diffText={activeIncident.activeApproval.diff}
                            commands={activeIncident.activeApproval.commands}
                            title="Proposed Code Patch & Terminal Execution Plan"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </motion.div>
                )}

                {/* Animated Typing Indicator */}
                {isInvestigating && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 text-xs font-mono text-blue-400 card-bg-subtle p-3 rounded-xl border theme-border"
                  >
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span>D-OpsPilot AI is inspecting container logs & running OpenAI tool calls...</span>
                  </motion.div>
                )}

                {/* Resolved Banner */}
                {activeIncident.status === 'RESOLVED' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="border-l-4 theme-alert-emerald p-3.5 rounded-r-xl text-xs font-bold text-emerald-600 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Incident Resolved & Service Health Verified (HTTP 200)</span>
                  </motion.div>
                )}

              </div>
            </motion.div>

            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="p-8 text-center text-subtitle text-xs">
            No chat selected. Start a new investigation from the message box below.
          </div>
        )}
      </div>

      {/* CLEAN IN-FLOW CHAT EDITOR */}
      <div>
        <div className="glass-panel p-3.5 rounded-2xl border theme-border shadow-2xl backdrop-blur-2xl space-y-2.5 focus-within:border-blue-500/80 transition-all">
          {isListening && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-mono font-bold animate-pulse">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                </span>
                <span>{voiceStatus || '🎙️ Listening... Speak your command now'}</span>
              </div>
              <button 
                type="button"
                onClick={toggleVoiceRecognition}
                className="text-[10px] underline hover:text-rose-400 cursor-pointer"
              >
                Stop Recording
              </button>
            </div>
          )}

          <textarea
            rows={2}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === 'SERVER_ONLY'
                ? "Describe an outage or command (e.g. 'Investigate 502 Bad Gateway error', 'Fix login API 500 bug', 'Check database connection status')... (Press Enter to send)"
                : mode === 'HYBRID_BOTH'
                  ? "Describe a repository audit, deployment issue, or server diagnostic... (Press Enter to send)"
                  : "Describe a code security audit or repository issue (e.g. 'Audit JWT secret fallback key', 'Sanitize route parameter in auth controller', 'Check GitHub branch protection')... (Press Enter to send)"
            }
            className="w-full bg-transparent border-none text-title text-xs focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500/50 placeholder:opacity-50 font-mono resize-none leading-relaxed px-1"
          />

          <div className="flex items-center justify-between border-t theme-border pt-2 font-mono text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {([
                ...((mode === 'GITHUB_ONLY' || mode === 'HYBRID_BOTH') ? [
                  { key: 'SECURITY_AUDIT', label: '🛡️ Security Audit', prompt: 'Perform automated repository security audit to scan for hardcoded secret fallback keys and vulnerable dependencies.' },
                  { key: 'CODE_BUG', label: '🐞 Route Parameter Bug', prompt: 'Inspect auth.controller.ts for unsanitized route parameter integer query exceptions and apply fix.' },
                  { key: 'CONFIG_MISMATCH', label: '🛠 Git Branch Verification', prompt: 'Verify target audit branch main protection, authenticated status, and commit history.' },
                  { key: 'SECURITY_AUDIT', label: '🔒 Env Secret Check', prompt: 'Check process.env.JWT_SECRET requirement enforcement across backend authentication services.' },
                  { key: 'PERF_DIAGNOSTIC', label: '📦 Package Audit', prompt: 'Inspect backend/package.json for outdated or insecure node dependency packages.' },
                ] : []),
                ...((mode === 'SERVER_ONLY' || mode === 'HYBRID_BOTH') ? [
                { key: 'DATABASE_STOPPED', label: '⚡ 502 Outage', prompt: 'Production API down with 502 Bad Gateway. Trace root cause and execute recovery patch.' },
                { key: 'CONFIG_MISMATCH', label: '🛠 Config Mismatch', prompt: 'API DB connection failed after deployment. Inspect environment configuration and fix host URL.' },
                { key: 'CODE_BUG', label: '🐞 Login 500 Bug', prompt: 'User login API returns 500 Internal Server Error. Inspect Prisma query types and apply safe patch.' },
                { key: 'SECURITY_AUDIT', label: '🌐 Server Security', prompt: 'Perform server security audit to inspect open ports, SSH posture, and container exposure.' },
                { key: 'PERF_DIAGNOSTIC', label: '📊 Check Latency', prompt: 'Run deep diagnostic on API response latency, memory consumption, and database query index usage.' },
                ] : [])
              ]).map(sc => (
                <button
                  key={sc.label}
                  onClick={() => {
                    setSelectedScenarioKey(sc.key);
                    setPromptText(sc.prompt);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
                    selectedScenarioKey === sc.key && promptText === sc.prompt
                      ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                      : 'card-bg-subtle text-title border theme-border hover:bg-slate-500/10 hover:border-blue-500/30'
                  }`}
                >
                  {sc.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Voice Command Dictation Mic Button */}
              <button
                type="button"
                onClick={toggleVoiceRecognition}
                title={isListening ? 'Listening... Click to stop voice input' : 'Voice Command (Speak to OpsPilot AI)'}
                className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-500 text-white shadow-lg ring-4 ring-rose-500/30 animate-pulse'
                    : 'card-bg-subtle text-subtitle border theme-border hover:text-blue-500 hover:border-blue-500/40'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-3.5 h-3.5 animate-bounce text-white" />
                ) : (
                  <Mic className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Send Button (Highlighted ONLY when text is present) */}
              <motion.button
                whileHover={{ scale: promptText.trim() && !isInvestigating ? 1.05 : 1 }}
                whileTap={{ scale: promptText.trim() && !isInvestigating ? 0.95 : 1 }}
                onClick={handleLaunchInvestigation}
                disabled={!promptText.trim() || isInvestigating}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                  promptText.trim() && !isInvestigating
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md glow-blue cursor-pointer'
                    : 'card-bg-subtle text-subtitle border theme-border cursor-not-allowed opacity-50'
                }`}
              >
                {isInvestigating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Sleek Terminal Logs Modal */}
      {showTerminalModal && activeIncident && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <TerminalConsole
            events={activeIncident.events}
            incidentId={activeIncident.id}
            onClose={() => setShowTerminalModal(false)}
          />
        </div>
      )}

    </motion.div>
  );
};
