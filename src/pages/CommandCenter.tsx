import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Cpu, 
  Layers, 
  ShieldAlert, 
  ArrowRight,
  FileText,
  Activity,
  Zap,
  Play,
  RotateCcw,
  Check
} from 'lucide-react';
import { Incident, IncidentEvent } from '../types';
import { startIncident, approveFix, rejectFix } from '../services/api';
import { DiffViewer } from '../components/DiffViewer';

interface CommandCenterProps {
  incidents: Incident[];
  onRefreshIncidents: () => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ incidents, onRefreshIncidents }) => {
  const [promptText, setPromptText] = useState<string>('Meri production API down hai, 502 Bad Gateway aa raha hai. Issue check karke safe fix do.');
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<string>('DATABASE_STOPPED');
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);
  const [isInvestigating, setIsInvestigating] = useState<boolean>(false);

  // Auto-select latest incident
  useEffect(() => {
    if (incidents.length > 0 && !activeIncidentId) {
      setActiveIncidentId(incidents[0].id);
    }
  }, [incidents, activeIncidentId]);

  const activeIncident = incidents.find(i => i.id === activeIncidentId) || incidents[0];

  const handleLaunchInvestigation = async () => {
    try {
      setIsInvestigating(true);
      const newInc = await startIncident(promptText, selectedScenarioKey);
      setActiveIncidentId(newInc.id);
      onRefreshIncidents();
    } catch (err) {
      console.error(err);
    } finally {
      setIsInvestigating(false);
    }
  };

  const handleApprove = async (approvalId: string) => {
    try {
      await approveFix(approvalId);
      onRefreshIncidents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (approvalId: string) => {
    try {
      await rejectFix(approvalId);
      onRefreshIncidents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
                Agentic Incident Commander
              </span>
              <span className="text-xs font-mono text-slate-400">Status: Real-time Orchestration</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1">Incident Command Center</h1>
            <p className="text-xs text-slate-400 mt-1">
              Natural language prompt input for production issues. OpsPilot AI checks logs, container states, database connections, and recent commit diffs.
            </p>
          </div>

          {/* Quick Scenario Picker Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'DATABASE_STOPPED', label: '502 Bad Gateway', prompt: 'Meri API down hai 502 aa raha hai. Check karke fix propose karo.' },
              { key: 'CONFIG_MISMATCH', label: 'Config Mismatch', prompt: 'API DB connection error aa raha hai after deployment. Check configs.' },
              { key: 'CODE_BUG', label: 'Login 500 Error', prompt: 'Login API 500 error de rahi hai. Stack trace padh ke safe patch karo.' },
            ].map(sc => (
              <button
                key={sc.key}
                onClick={() => {
                  setSelectedScenarioKey(sc.key);
                  setPromptText(sc.prompt);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedScenarioKey === sc.key
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input Form */}
        <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
          <Terminal className="w-5 h-5 text-blue-400 ml-2" />
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Describe production failure (e.g., 'API is returning 502 Bad Gateway...')"
            className="flex-1 bg-transparent border-none text-slate-100 text-sm focus:outline-none placeholder:text-slate-500 font-mono"
          />
          <button
            onClick={handleLaunchInvestigation}
            disabled={isInvestigating}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-lg shadow-blue-600/30 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isInvestigating ? 'Investigating...' : 'Investigate Outage'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Incident Selector / Timeline / Approval Modal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Incidents List */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active & Historical Incidents</h2>
          
          <div className="space-y-2">
            {incidents.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 glass-panel rounded-xl">
                No active incidents yet. Click "Investigate Outage" above to launch an investigation.
              </div>
            ) : (
              incidents.map(inc => {
                const isSelected = activeIncidentId === inc.id;
                const statusBadge = 
                  inc.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  inc.status === 'AWAITING_APPROVAL' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse' :
                  inc.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                  'bg-blue-500/20 text-blue-400 border-blue-500/30';

                return (
                  <div
                    key={inc.id}
                    onClick={() => setActiveIncidentId(inc.id)}
                    className={`glass-panel p-4 rounded-xl border cursor-pointer transition ${
                      isSelected ? 'border-blue-500 bg-slate-900/90 shadow-md' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono text-slate-400">{inc.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${statusBadge}`}>
                        {inc.status}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-100 line-clamp-1">{inc.title}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{inc.userPrompt}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (2 Spans): Live Agent Timeline & Root Cause Card */}
        <div className="lg:col-span-2 space-y-6">
          {activeIncident ? (
            <>
              {/* Incident Header Status Bar */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-blue-400">Incident: {activeIncident.id}</span>
                    <span className="text-xs font-mono text-slate-400">• Severity: {activeIncident.severity}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-0.5">{activeIncident.title}</h2>
                </div>

                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    activeIncident.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                    activeIncident.status === 'AWAITING_APPROVAL' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse' :
                    'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  }`}>
                    {activeIncident.status}
                  </span>
                </div>
              </div>

              {/* Active Approval Modal / Drawer (if AWAITING_APPROVAL) */}
              {activeIncident.status === 'AWAITING_APPROVAL' && activeIncident.activeApproval && (
                <div className="glass-panel p-6 rounded-2xl border-2 border-amber-500/80 bg-slate-950/95 space-y-4 shadow-2xl shadow-amber-500/10">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-amber-400 animate-bounce" />
                      <h3 className="text-base font-bold text-white">Approval Required: {activeIncident.activeApproval.title}</h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Risk Level: {activeIncident.activeApproval.riskLevel}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    {activeIncident.activeApproval.description}
                  </p>

                  {/* Render Diff or Command List */}
                  <DiffViewer
                    diffText={activeIncident.activeApproval.diff}
                    commands={activeIncident.activeApproval.commands}
                    title="Proposed Recovery Patch & Action Commands"
                  />

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs text-slate-400">
                    <b className="text-slate-300">Rollback Strategy:</b> {activeIncident.activeApproval.rollbackPlan}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => handleReject(activeIncident.activeApproval!.id)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition"
                    >
                      Reject Action
                    </button>
                    <button
                      onClick={() => handleApprove(activeIncident.activeApproval!.id)}
                      className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve & Execute Fix</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Root Cause Diagnosis Panel (if populated) */}
              {activeIncident.rootCause && (
                <div className="glass-panel p-5 rounded-2xl border border-blue-500/40 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950/30 space-y-2">
                  <div className="flex items-center justify-between text-xs text-blue-400 font-semibold">
                    <span className="flex items-center gap-1.5 uppercase tracking-wider">
                      <Zap className="w-4 h-4 text-blue-400" /> Root Cause Diagnosed
                    </span>
                    <span>Confidence Score: <b>{activeIncident.confidence}%</b></span>
                  </div>
                  <p className="text-sm font-semibold text-slate-100 leading-relaxed">
                    {activeIncident.rootCause}
                  </p>
                </div>
              )}

              {/* Live Agent Reasoning Timeline Events */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span>Agent Investigation Timeline & Tool Execution Log</span>
                </h3>

                <div className="space-y-4 relative before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
                  {activeIncident.events.map((evt, idx) => (
                    <div key={evt.id || idx} className="flex items-start gap-4 relative pl-8">
                      <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-blue-500 flex items-center justify-center text-[9px] text-blue-400 font-mono">
                        {idx + 1}
                      </div>

                      <div className="glass-panel p-4 rounded-xl border border-slate-800/80 flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200">{evt.title}</span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {new Date(evt.createdAt).toLocaleTimeString()}
                          </span>
                        </div>

                        {/* Event Details Content */}
                        {evt.details && (
                          <div className="text-xs text-slate-300 font-mono space-y-1 bg-slate-950 p-3 rounded-lg border border-slate-800/60">
                            {evt.type === 'TOOL_CALL' && (
                              <div>
                                <div className="text-blue-400">$ {evt.details.command}</div>
                                <div className="text-slate-400 text-[11px] whitespace-pre-wrap mt-1">{evt.details.output}</div>
                              </div>
                            )}

                            {evt.type === 'EVIDENCE' && evt.details.evidence && (
                              <div className="space-y-1">
                                {evt.details.evidence.map((ev: any, i: number) => (
                                  <div key={i} className="flex items-start gap-2">
                                    <span className="text-emerald-400 font-bold">✓</span>
                                    <span><b className="text-slate-200">{ev.source}:</b> {ev.detail}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {evt.type === 'VERIFICATION' && evt.details.checks && (
                              <div className="space-y-1">
                                {evt.details.checks.map((chk: any, i: number) => (
                                  <div key={i} className="flex items-center justify-between text-xs py-0.5 border-b border-slate-900">
                                    <span className="text-slate-300">{chk.check}</span>
                                    <span className="text-emerald-400 font-bold">{chk.result}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {evt.type === 'PLAN' && evt.details.steps && (
                              <ul className="list-disc list-inside space-y-1 text-slate-300 font-sans text-xs">
                                {evt.details.steps.map((st: string, i: number) => (
                                  <li key={i}>{st}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs">
              No incident selected. Select or launch a new outage investigation above.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
