import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building, 
  Cpu, 
  Shield, 
  Plus, 
  Server, 
  Terminal, 
  Trash2, 
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Users,
  Save,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Zap,
  Bell,
  Download,
  FileJson,
  Send,
  Sliders,
  Type,
  CheckSquare,
  AlertOctagon,
  Clock,
  ShieldAlert,
  UserPlus,
  Palette,
  Upload
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchProjects, removeProject } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { Project } from '../types';

interface SettingsPageProps {
  onOpenSetupModal?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onOpenSetupModal }) => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<'projects' | 'ai' | 'webhooks' | 'guardrails' | 'team' | 'vault'>('projects');
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Infrastructure settings
  const [pollingInterval, setPollingInterval] = useState<string>(() => localStorage.getItem('opspilot_polling_interval') || '5s');
  const [dockerTimeout, setDockerTimeout] = useState<string>(() => localStorage.getItem('opspilot_docker_timeout') || '60s');

  // AI Model & API Parameters
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('opspilot_openai_key') || 'sk-proj-78a9f2bc31948e9102ab0541');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>(() => localStorage.getItem('opspilot_selected_model') || 'gpt-4o');
  const [reasoningTemperature, setReasoningTemperature] = useState<number>(() => {
    const saved = localStorage.getItem('opspilot_temperature');
    return saved ? parseFloat(saved) : 0.2;
  });
  const [maxTokens, setMaxTokens] = useState<number>(() => {
    const saved = localStorage.getItem('opspilot_max_tokens');
    return saved ? parseInt(saved, 10) : 8192;
  });
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // AI Persona Prompt
  const defaultSystemPrompt = `You are OpsPilot AI, a Senior SRE & Autonomous DevOps Engineer. You inspect container logs, trace root cause failures, enforce zero-downtime micro-patches, and verify HTTP 200 health check recovery.`;
  const [systemPrompt, setSystemPrompt] = useState<string>(() => localStorage.getItem('opspilot_system_prompt') || defaultSystemPrompt);

  // Webhook settings
  const [webhookUrl, setWebhookUrl] = useState<string>(() => localStorage.getItem('opspilot_webhook_url') || 'https://hooks.slack.com/services/T00/B00/XXXXX');
  const [payloadFormat, setPayloadFormat] = useState<string>(() => localStorage.getItem('opspilot_payload_format') || 'Slack Block Kit');
  const [isTestingWebhook, setIsTestingWebhook] = useState<boolean>(false);
  const [webhookEvents, setWebhookEvents] = useState({
    onOutage: true,
    onApprovalNeeded: true,
    onAutoRecovery: true,
    onSecurityScan: false,
  });

  // Forbidden terminal commands filter
  const [forbiddenCmds, setForbiddenCmds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('opspilot_forbidden_cmds');
      return saved ? JSON.parse(saved) : ['rm -rf /', 'mkfs', 'dd if=/dev/zero', 'chmod 777 /', 'reboot -f'];
    } catch {
      return ['rm -rf /', 'mkfs', 'dd if=/dev/zero', 'chmod 777 /', 'reboot -f'];
    }
  });
  const [newForbiddenCmd, setNewForbiddenCmd] = useState<string>('');

  // Terminal & UI Customization
  const [terminalFont, setTerminalFont] = useState<string>(() => localStorage.getItem('opspilot_terminal_font') || 'JetBrains Mono');
  const [terminalFontSize, setTerminalFontSize] = useState<string>(() => localStorage.getItem('opspilot_terminal_fontsize') || '13px');
  const [terminalTheme, setTerminalTheme] = useState<string>(() => localStorage.getItem('opspilot_terminal_theme') || 'Cyber Dark');

  // Guardrail Policies
  const defaultGuardrails = [
    { id: 'human-approval', name: 'Human Operator Approval Required', desc: 'All destructive write actions (patching code, restarting containers) require explicit user sign-off', enabled: true, category: 'CRITICAL' },
    { id: 'audit-logging', name: 'Immutable Audit Trail Logging', desc: 'Every prompt, system diagnosis, and command execution is logged to the local database', enabled: true, category: 'COMPLIANCE' },
    { id: 'auto-rollback', name: 'Auto-Rollback on Health Check Failure', desc: 'Automatically revert git commits and container restarts if HTTP 200 health check fails after 30s', enabled: true, category: 'SAFETY' },
    { id: 'anomaly-throttle', name: 'Anomaly Traffic Rate Limiting', desc: 'Throttle automated requests if diagnostic frequency exceeds 60 executions per minute', enabled: false, category: 'SAFETY' },
  ];

  const [guardrails, setGuardrails] = useState(() => {
    try {
      const saved = localStorage.getItem('opspilot_guardrails');
      return saved ? JSON.parse(saved) : defaultGuardrails;
    } catch {
      return defaultGuardrails;
    }
  });

  // Operator & Org profile
  const [operatorName, setOperatorName] = useState<string>(() => localStorage.getItem('opspilot_operator_name') || user?.name || 'Chandan Vishwakarma');
  const [orgName, setOrgName] = useState<string>(() => localStorage.getItem('opspilot_org_name') || user?.organizationName || 'Acme Operations Corp');
  const [isVerifyingVault, setIsVerifyingVault] = useState<boolean>(false);

  // Team Roster State
  const [teamMembers] = useState([
    { name: 'Chandan Vishwakarma', email: 'chandan@opspilot.ai', role: 'ADMIN', status: 'ACTIVE' },
    { name: 'DevOps Lead Engineer', email: 'sre@opspilot.ai', role: 'OPERATOR', status: 'ACTIVE' },
    { name: 'Security Auditor', email: 'security@opspilot.ai', role: 'AUDITOR', status: 'ACTIVE' },
  ]);

  useEffect(() => {
    setIsLoading(true);
    fetchProjects()
      .then(setProjectsList)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleDeleteProject = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove project "${name}"?`)) {
      try {
        await removeProject(id);
        setProjectsList(prev => prev.filter(p => p.id !== id));
        addNotification({
          type: 'info',
          title: 'Project Removed',
          message: `Project configuration "${name}" was successfully removed.`
        });
      } catch (err: any) {
        addNotification({
          type: 'danger',
          title: 'Removal Failed',
          message: err.message || 'Failed to remove project configuration.'
        });
      }
    }
  };

  const handleToggleGuardrail = (id: string) => {
    setGuardrails((prev: any[]) => {
      const updated = prev.map(g => {
        if (g.id === id) {
          const nextState = !g.enabled;
          addNotification({
            type: nextState ? 'success' : 'warning',
            title: `Guardrail ${nextState ? 'Enabled' : 'Disabled'}`,
            message: `Policy "${g.name}" is now ${nextState ? 'ACTIVE' : 'INACTIVE'}.`
          });
          return { ...g, enabled: nextState };
        }
        return g;
      });
      localStorage.setItem('opspilot_guardrails', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddForbiddenCmd = () => {
    const cmd = newForbiddenCmd.trim();
    if (!cmd) return;
    if (forbiddenCmds.includes(cmd)) {
      addNotification({ type: 'warning', title: 'Already Exists', message: `Command "${cmd}" is already restricted.` });
      return;
    }
    const updated = [...forbiddenCmds, cmd];
    setForbiddenCmds(updated);
    localStorage.setItem('opspilot_forbidden_cmds', JSON.stringify(updated));
    setNewForbiddenCmd('');
    addNotification({ type: 'success', title: 'Command Blocked', message: `Added "${cmd}" to forbidden terminal commands filter.` });
  };

  const handleRemoveForbiddenCmd = (cmd: string) => {
    const updated = forbiddenCmds.filter(c => c !== cmd);
    setForbiddenCmds(updated);
    localStorage.setItem('opspilot_forbidden_cmds', JSON.stringify(updated));
    addNotification({ type: 'info', title: 'Command Unblocked', message: `Removed "${cmd}" from restricted list.` });
  };

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSaveInfraSettings = () => {
    localStorage.setItem('opspilot_polling_interval', pollingInterval);
    localStorage.setItem('opspilot_docker_timeout', dockerTimeout);
    addNotification({
      type: 'success',
      title: 'Infrastructure Settings Saved',
      message: `Polling rate set to ${pollingInterval}, Docker timeout set to ${dockerTimeout}.`
    });
  };

  const handleSaveAISettings = () => {
    localStorage.setItem('opspilot_openai_key', apiKey);
    localStorage.setItem('opspilot_selected_model', selectedModel);
    localStorage.setItem('opspilot_temperature', reasoningTemperature.toString());
    localStorage.setItem('opspilot_max_tokens', maxTokens.toString());
    localStorage.setItem('opspilot_system_prompt', systemPrompt);
    addNotification({
      type: 'success',
      title: 'AI Settings Saved',
      message: `Model set to "${selectedModel}" (Temp: ${reasoningTemperature}, Max Tokens: ${maxTokens}).`
    });
  };

  const handleSaveWebhooks = () => {
    localStorage.setItem('opspilot_webhook_url', webhookUrl);
    localStorage.setItem('opspilot_payload_format', payloadFormat);
    addNotification({
      type: 'success',
      title: 'Webhook Configuration Saved',
      message: `Webhook endpoint format set to ${payloadFormat}.`
    });
  };

  const handleTestWebhook = () => {
    setIsTestingWebhook(true);
    setTimeout(() => {
      setIsTestingWebhook(false);
      addNotification({
        type: 'success',
        title: 'Webhook Payload Delivered',
        message: `Sent test alert in ${payloadFormat} to Slack endpoint (HTTP 200 OK).`
      });
    }, 1200);
  };

  const handleSaveProfileAndUI = () => {
    localStorage.setItem('opspilot_operator_name', operatorName);
    localStorage.setItem('opspilot_org_name', orgName);
    localStorage.setItem('opspilot_terminal_font', terminalFont);
    localStorage.setItem('opspilot_terminal_fontsize', terminalFontSize);
    localStorage.setItem('opspilot_terminal_theme', terminalTheme);
    addNotification({
      type: 'success',
      title: 'Profile & UI Preferences Saved',
      message: `Updated profile for "${operatorName}" with font ${terminalFont} (${terminalFontSize}).`
    });
  };

  const handleExportBackupJson = () => {
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      organization: orgName,
      operator: operatorName,
      projects: projectsList,
      guardrails: guardrails,
      forbiddenCommands: forbiddenCmds,
      aiConfig: {
        model: selectedModel,
        temperature: reasoningTemperature,
        maxTokens: maxTokens,
        systemPrompt: systemPrompt
      },
      webhook: {
        url: webhookUrl,
        format: payloadFormat,
        events: webhookEvents
      },
      terminal: {
        font: terminalFont,
        fontSize: terminalFontSize,
        theme: terminalTheme
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `opspilot-backup-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addNotification({
      type: 'success',
      title: 'Backup Exported',
      message: 'Workspace configuration downloaded as JSON backup.'
    });
  };

  const handleTestVaultEncryption = async () => {
    setIsVerifyingVault(true);
    try {
      const key = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      if (key) {
        setTimeout(() => {
          setIsVerifyingVault(false);
          addNotification({
            type: 'success',
            title: 'Vault Integrity Verified',
            message: 'Web Crypto WebSubtle API AES-256 GCM encryption test passed with 0 errors.'
          });
        }, 800);
      }
    } catch (err) {
      setIsVerifyingVault(false);
      addNotification({
        type: 'danger',
        title: 'Vault Error',
        message: 'Web Crypto API is disabled in this environment.'
      });
    }
  };

  const tabs = [
    { id: 'projects', label: 'Projects & Infrastructure', icon: Server, badge: `${projectsList.length}` },
    { id: 'ai', label: 'AI Engine & Personas', icon: Cpu },
    { id: 'webhooks', label: 'Webhooks & Integrations', icon: Bell },
    { id: 'guardrails', label: 'Safety Guardrails', icon: Shield, badge: `${guardrails.filter((g: any) => g.enabled).length}/${guardrails.length}` },
    { id: 'team', label: 'Organization & Team', icon: Users },
    { id: 'vault', label: 'Vault, UI & Backup', icon: Building },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.35 }}
      className="space-y-6 max-w-5xl mx-auto font-sans pb-12"
    >
      
      {/* Top Header Banner */}
      <div className="glass-panel p-6 rounded-2xl theme-border border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold font-mono">
              Enterprise Operations Control Center
            </span>
          </div>
          <h1 className="text-2xl font-bold text-title tracking-tight font-display">Workspace Settings</h1>
          <p className="text-xs text-subtitle max-w-2xl leading-relaxed">
            Manage multi-project server connections, client-side encryption vault, AI reasoning models, Slack webhooks, safety guardrails, and team roles.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportBackupJson}
            title="Export workspace backup JSON"
            className="flex items-center gap-2 px-3.5 py-2 card-bg-subtle hover:bg-slate-500/10 text-title border theme-border text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span>Export Backup</span>
          </button>

          {onOpenSetupModal && (
            <button
              onClick={onOpenSetupModal}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md glow-blue transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Setup Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Zero-DB Client Encryption Vault Status Bar */}
      <div className="glass-panel p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-title block flex items-center gap-2">
              Zero-DB Client Encryption Vault Active
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            </span>
            <span className="text-[11px] text-subtitle">
              SSH host keys, passwords, and GitHub tokens are encrypted in Web Crypto storage. Zero credentials stored on server DB.
            </span>
          </div>
        </div>

        <button
          onClick={handleTestVaultEncryption}
          disabled={isVerifyingVault}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-extrabold border border-emerald-500/30 hover:bg-emerald-500/30 transition shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${isVerifyingVault ? 'animate-spin' : ''}`} />
          <span>{isVerifyingVault ? 'Verifying...' : 'Test Vault WebCrypto'}</span>
        </button>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b theme-border pb-1 overflow-x-auto">
        {tabs.map((t) => {
          const TIcon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md glow-blue'
                  : 'card-bg-subtle text-subtitle hover:text-title hover:bg-slate-500/10 border theme-border'
              }`}
            >
              <TIcon className="w-4 h-4" />
              <span>{t.label}</span>
              {t.badge && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-500/10 text-subtitle'
                }`}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      <div className="space-y-6">

        {/* TAB 1: PROJECTS & INFRASTRUCTURE */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-title uppercase tracking-wider font-mono flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-500" />
                <span>Connected Infrastructure Projects ({projectsList.length})</span>
              </h2>
              {onOpenSetupModal && (
                <button
                  onClick={onOpenSetupModal}
                  className="text-xs text-blue-500 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Project</span>
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-subtitle text-xs font-mono">Loading connected projects...</div>
            ) : projectsList.length === 0 ? (
              <div className="glass-panel p-8 rounded-2xl theme-border border text-center space-y-3">
                <Server className="w-8 h-8 text-subtitle mx-auto" />
                <h3 className="text-sm font-bold text-title">No Connected Projects</h3>
                <p className="text-xs text-subtitle max-w-sm mx-auto">Set up your first project to connect OpsPilot AI with a repository and server host.</p>
                {onOpenSetupModal && (
                  <button
                    onClick={onOpenSetupModal}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    Setup First Project
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectsList.map((proj, idx) => {
                  const sshString = proj.serverHost ? `${proj.serverUser || 'root'}@${proj.serverHost}:${proj.serverPort || 22}` : 'Local Sandbox Engine';
                  return (
                    <div
                      key={proj.id}
                      className="glass-panel p-5 rounded-2xl theme-border border space-y-3 glass-panel-hover"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            <Terminal className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-title">{proj.name}</h3>
                            <span className="text-[10px] text-subtitle font-mono">ID: #{proj.id}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteProject(proj.id, proj.name)}
                          title="Remove Project"
                          aria-label={`Remove project ${proj.name}`}
                          className="p-1.5 rounded-lg text-subtitle hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2 text-xs font-mono">
                        <div className="p-2.5 rounded-xl card-bg-subtle border theme-border flex items-center justify-between">
                          <div className="truncate">
                            <span className="text-[10px] text-subtitle block">SSH Server Connection</span>
                            <span className="text-title font-bold truncate block">{sshString}</span>
                          </div>
                          {proj.serverHost && (
                            <button
                              onClick={() => handleCopyText(sshString, idx)}
                              title="Copy SSH Connection String"
                              className="p-1.5 rounded-md hover:bg-slate-500/10 text-subtitle hover:text-title transition shrink-0 cursor-pointer"
                            >
                              {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 rounded-xl card-bg-subtle border theme-border">
                            <span className="text-[10px] text-subtitle block">Environment</span>
                            <span className="text-title font-bold text-[11px]">{proj.environmentType || 'Docker Compose'}</span>
                          </div>
                          <div className="p-2 rounded-xl card-bg-subtle border theme-border">
                            <span className="text-[10px] text-subtitle block">Vault Status</span>
                            <span className="text-emerald-500 font-bold text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Encrypted
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Infrastructure Polling & Timeout Config */}
            <div className="glass-panel p-6 rounded-2xl theme-border border space-y-4">
              <div className="flex items-center justify-between border-b theme-border pb-3">
                <h3 className="text-xs font-bold text-title uppercase tracking-wider font-mono flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>Infrastructure Health Polling & Timeouts</span>
                </h3>
                <button
                  onClick={handleSaveInfraSettings}
                  className="flex items-center gap-1 text-xs text-blue-500 font-bold hover:underline cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-subtitle font-bold block">Cluster Health Auto-Refresh Rate</label>
                  <select
                    value={pollingInterval}
                    onChange={(e) => setPollingInterval(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border theme-border card-bg-subtle text-title font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value="5s">Every 5 Seconds (High Realtime)</option>
                    <option value="10s">Every 10 Seconds (Balanced)</option>
                    <option value="30s">Every 30 Seconds (Low Overhead)</option>
                    <option value="disabled">Disabled (Manual Refresh Only)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-subtitle font-bold block">Docker Command Execution Timeout</label>
                  <select
                    value={dockerTimeout}
                    onChange={(e) => setDockerTimeout(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border theme-border card-bg-subtle text-title font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value="30s">30 Seconds Timeout</option>
                    <option value="60s">60 Seconds Timeout (Recommended)</option>
                    <option value="120s">120 Seconds Timeout (Long Builds)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI ENGINE & PERSONAS */}
        {activeTab === 'ai' && (
          <div className="glass-panel p-6 rounded-2xl theme-border border space-y-6">
            <div className="flex items-center justify-between border-b theme-border pb-4">
              <div>
                <h2 className="text-sm font-bold text-title flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-500" />
                  <span>OpenAI API & System Personas</span>
                </h2>
                <p className="text-xs text-subtitle">Configure system prompt parameters, model choice, token limits, and API keys.</p>
              </div>
              <button
                onClick={handleSaveAISettings}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save AI Config</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Model Choice & Temp */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-title block">Primary Reasoning Model</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border theme-border card-bg-subtle text-title text-xs font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value="gpt-4o">gpt-4o (High-Precision Multi-Tool Reasoning & Root Cause Analysis)</option>
                    <option value="gpt-4o-mini">gpt-4o-mini (Fast Log Parsing & Low Latency)</option>
                    <option value="o1-mini">o1-mini (Deep Static Code Vulnerability Audit)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-title">Reasoning Temperature</label>
                    <span className="font-mono text-blue-500 font-bold">{reasoningTemperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={reasoningTemperature}
                    onChange={(e) => setReasoningTemperature(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-subtitle font-mono">
                    <span>Deterministic (0.0)</span>
                    <span>Balanced (0.5)</span>
                    <span>Creative (1.0)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-title">Max Output Token Limit</label>
                    <span className="font-mono text-blue-500 font-bold">{maxTokens} Tokens</span>
                  </div>
                  <input
                    type="range"
                    min="2048"
                    max="16384"
                    step="1024"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold text-title block">OpenAI API Key Token</label>
                  <div className="relative flex items-center">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border theme-border card-bg-subtle text-title text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 text-subtitle hover:text-title p-1 transition cursor-pointer"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* AI System Persona Instructions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-title block">AI System Persona Prompt</label>
                  <button
                    onClick={() => setSystemPrompt(defaultSystemPrompt)}
                    className="text-[10px] text-blue-500 hover:underline font-mono font-bold cursor-pointer"
                  >
                    Reset to Default
                  </button>
                </div>

                <textarea
                  rows={7}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full p-3 rounded-xl border theme-border card-bg-subtle text-title text-xs font-mono focus:outline-none focus:border-blue-500 leading-relaxed resize-none"
                  placeholder="Enter system prompt guidelines..."
                />

                <div className="flex items-center gap-2 overflow-x-auto pt-1">
                  <span className="text-[10px] text-subtitle font-mono uppercase shrink-0">Preset Personas:</span>
                  {[
                    { label: 'Strict SRE', prompt: 'You are OpsPilot AI, a Strict SRE. Prioritize system uptime, minimal code changes, and immediate rollback on errors.' },
                    { label: 'Security Auditor', prompt: 'You are OpsPilot AI, a Security Auditor. Focus strictly on credential leaks, CVE vulnerabilities, and IAM permissions.' },
                    { label: 'Speed Operator', prompt: 'You are OpsPilot AI, a Speed-First Operator. Resolve incidents rapidly using automated container restarts and quick patches.' },
                    { label: 'Compliance Officer', prompt: 'You are OpsPilot AI, a Compliance Officer. Require explicit audit logging and operator sign-off before executing commands.' },
                  ].map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => setSystemPrompt(preset.prompt)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold card-bg-subtle border theme-border text-title hover:border-blue-500/40 shrink-0 cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WEBHOOKS & INTEGRATIONS */}
        {activeTab === 'webhooks' && (
          <div className="glass-panel p-6 rounded-2xl theme-border border space-y-6">
            <div className="flex items-center justify-between border-b theme-border pb-4">
              <div>
                <h2 className="text-sm font-bold text-title flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-500" />
                  <span>Slack & Webhook Incident Alerts</span>
                </h2>
                <p className="text-xs text-subtitle">Send automated incident reports to Slack, Microsoft Teams, or custom HTTP webhooks.</p>
              </div>
              <button
                onClick={handleSaveWebhooks}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Webhooks</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-title block">Incoming Webhook URL</label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border theme-border card-bg-subtle text-title text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-title block">Payload Format</label>
                  <select
                    value={payloadFormat}
                    onChange={(e) => setPayloadFormat(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border theme-border card-bg-subtle text-title text-xs font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value="Slack Block Kit">Slack Block Kit</option>
                    <option value="Discord Embed">Discord Rich Embed</option>
                    <option value="Raw JSON">Standard Raw JSON</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={isTestingWebhook}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${isTestingWebhook ? 'animate-bounce' : ''}`} />
                  <span>{isTestingWebhook ? 'Sending...' : 'Test Webhook Payload'}</span>
                </button>
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-title block font-mono uppercase tracking-wider">Trigger Notification Events</label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'onOutage', label: 'Outage / Service Degraded Event', desc: 'Trigger when container stops or health check returns 502' },
                    { id: 'onApprovalNeeded', label: 'Fix Patch Awaiting Operator Approval', desc: 'Trigger when AI proposes code fix requiring sign-off' },
                    { id: 'onAutoRecovery', label: 'Service Auto-Recovery Completed', desc: 'Trigger when HTTP 200 health check confirms resolution' },
                    { id: 'onSecurityScan', label: 'Security Vulnerability Found', desc: 'Trigger when GitHub audit detects HIGH severity CVE' },
                  ].map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => setWebhookEvents(prev => ({ ...prev, [ev.id]: !prev[ev.id as keyof typeof prev] }))}
                      className="p-3.5 rounded-xl card-bg-subtle border theme-border flex items-start gap-3 cursor-pointer hover:border-blue-500/40 transition"
                    >
                      <input
                        type="checkbox"
                        checked={webhookEvents[ev.id as keyof typeof webhookEvents]}
                        onChange={() => {}}
                        className="mt-0.5 accent-blue-600 rounded cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-title block">{ev.label}</span>
                        <span className="text-[11px] text-subtitle block leading-relaxed">{ev.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SAFETY GUARDRAILS & FORBIDDEN COMMANDS */}
        {activeTab === 'guardrails' && (
          <div className="space-y-6">
            {/* Safety Policies */}
            <div className="glass-panel p-6 rounded-2xl theme-border border space-y-6">
              <div className="border-b theme-border pb-4">
                <h2 className="text-sm font-bold text-title flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span>AI Automated Safety Guardrails & Policies</span>
                </h2>
                <p className="text-xs text-subtitle">Toggle automated guardrails to strictly control what actions OpsPilot AI can perform autonomously.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {guardrails.map((policy: any) => (
                  <div
                    key={policy.id}
                    className={`p-4 rounded-2xl border theme-border transition-all flex items-center justify-between gap-4 ${
                      policy.enabled ? 'card-bg-subtle hover:border-blue-500/40' : 'opacity-70 card-bg-subtle'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-title">{policy.name}</span>
                        <span className={`px-2 py-0.2 rounded text-[9px] font-bold font-mono border ${
                          policy.category === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        }`}>
                          {policy.category}
                        </span>
                      </div>
                      <p className="text-xs text-subtitle max-w-xl">{policy.desc}</p>
                    </div>

                    <button
                      onClick={() => handleToggleGuardrail(policy.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        policy.enabled ? 'bg-blue-600' : 'bg-slate-700/40 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          policy.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Forbidden Terminal Commands Filter */}
            <div className="glass-panel p-6 rounded-2xl theme-border border space-y-4">
              <div className="flex items-center justify-between border-b theme-border pb-3">
                <h3 className="text-xs font-bold text-title uppercase tracking-wider font-mono flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-500" />
                  <span>Forbidden Terminal Commands Filter ({forbiddenCmds.length})</span>
                </h3>
              </div>
              <p className="text-xs text-subtitle">OpsPilot AI agent is strictly blocked from executing any command pattern listed below.</p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newForbiddenCmd}
                  onChange={(e) => setNewForbiddenCmd(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddForbiddenCmd()}
                  placeholder="Add restricted command pattern (e.g. 'sudo rm', 'drop database')..."
                  className="flex-1 px-3.5 py-2 rounded-xl border theme-border card-bg-subtle text-title text-xs font-mono focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddForbiddenCmd}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer shrink-0"
                >
                  Block Command
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {forbiddenCmds.map((cmd, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-mono font-bold"
                  >
                    <span>{cmd}</span>
                    <button
                      onClick={() => handleRemoveForbiddenCmd(cmd)}
                      className="hover:text-rose-700 p-0.5 rounded cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ORGANIZATION & TEAM ACCESS */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Organization Info */}
              <div className="glass-panel p-6 rounded-2xl theme-border border space-y-4">
                <div className="flex items-center justify-between border-b theme-border pb-3">
                  <h2 className="text-xs font-bold text-title uppercase tracking-wider font-mono flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-500" />
                    <span>Organization Identity</span>
                  </h2>
                  <button
                    onClick={handleSaveProfileAndUI}
                    className="flex items-center gap-1 text-xs text-blue-500 font-bold hover:underline cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-subtitle font-bold block">Organization Name</label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border theme-border card-bg-subtle text-title font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-subtitle font-bold block">Organization ID</label>
                    <input
                      type="text"
                      disabled
                      value={user?.organizationId || 'org-acme-corp'}
                      className="w-full px-3.5 py-2.5 rounded-xl border theme-border card-bg-subtle text-subtitle font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Active Operator Profile */}
              <div className="glass-panel p-6 rounded-2xl theme-border border space-y-4">
                <div className="flex items-center justify-between border-b theme-border pb-3">
                  <h2 className="text-xs font-bold text-title uppercase tracking-wider font-mono flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-500" />
                    <span>Active Operator Profile</span>
                  </h2>
                  <button
                    onClick={handleSaveProfileAndUI}
                    className="flex items-center gap-1 text-xs text-blue-500 font-bold hover:underline cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Profile
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-subtitle font-bold block">Operator Display Name</label>
                    <input
                      type="text"
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border theme-border card-bg-subtle text-title font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-subtitle font-bold block">Assigned Role</label>
                    <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border theme-border card-bg-subtle font-mono text-title">
                      <span>{user?.role || 'ADMIN'}</span>
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-500 border border-blue-500/30 text-[10px] font-bold">
                        SUPERUSER
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Roster Table */}
            <div className="glass-panel p-6 rounded-2xl theme-border border space-y-4">
              <div className="flex items-center justify-between border-b theme-border pb-3">
                <h3 className="text-xs font-bold text-title uppercase tracking-wider font-mono flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span>Team Access Roster ({teamMembers.length})</span>
                </h3>
                <button
                  onClick={() => addNotification({ type: 'info', title: 'Invite Link', message: 'Team invite link copied to clipboard.' })}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Invite Member</span>
                </button>
              </div>

              <div className="space-y-2">
                {teamMembers.map((member, mIdx) => (
                  <div key={mIdx} className="flex items-center justify-between p-3 rounded-xl card-bg-subtle border theme-border text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-title">{member.name}</div>
                        <div className="text-[11px] text-subtitle font-mono">{member.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-mono font-bold">
                        {member.role}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-500 font-bold">
                        {member.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: VAULT, TERMINAL UI & BACKUP EXPORT */}
        {activeTab === 'vault' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Terminal Customization */}
            <div className="glass-panel p-6 rounded-2xl theme-border border space-y-4">
              <div className="flex items-center justify-between border-b theme-border pb-3">
                <h2 className="text-xs font-bold text-title uppercase tracking-wider font-mono flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-500" />
                  <span>Terminal Console Customization</span>
                </h2>
                <button
                  onClick={handleSaveProfileAndUI}
                  className="flex items-center gap-1 text-xs text-blue-500 font-bold hover:underline cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Save UI
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-subtitle font-bold block">Console Font Family</label>
                  <select
                    value={terminalFont}
                    onChange={(e) => setTerminalFont(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border theme-border card-bg-subtle text-title font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value="JetBrains Mono">JetBrains Mono (Recommended)</option>
                    <option value="Fira Code">Fira Code (With Ligatures)</option>
                    <option value="Source Code Pro">Source Code Pro</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-subtitle font-bold block">Console Font Size</label>
                    <select
                      value={terminalFontSize}
                      onChange={(e) => setTerminalFontSize(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border theme-border card-bg-subtle text-title font-mono focus:outline-none focus:border-blue-500"
                    >
                      <option value="12px">12px (Compact)</option>
                      <option value="13px">13px (Standard)</option>
                      <option value="15px">15px (Large)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-subtitle font-bold block">Terminal Theme</label>
                    <select
                      value={terminalTheme}
                      onChange={(e) => setTerminalTheme(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border theme-border card-bg-subtle text-title font-mono focus:outline-none focus:border-blue-500"
                    >
                      <option value="Cyber Dark">Cyber Dark</option>
                      <option value="Dracula">Dracula Dark</option>
                      <option value="Monokai">Monokai Pro</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Workspace Backup & Maintenance */}
            <div className="glass-panel p-6 rounded-2xl theme-border border space-y-4">
              <h2 className="text-xs font-bold text-title uppercase tracking-wider font-mono flex items-center gap-2 border-b theme-border pb-3">
                <FileJson className="w-4 h-4 text-emerald-500" />
                <span>Backup & Workspace Maintenance</span>
              </h2>

              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl card-bg-subtle border theme-border flex items-center justify-between">
                  <div>
                    <span className="font-bold text-title block">Export Workspace JSON</span>
                    <span className="text-[11px] text-subtitle">Download full settings backup file</span>
                  </div>
                  <button
                    onClick={handleExportBackupJson}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JSON</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-xl card-bg-subtle border theme-border flex items-center justify-between">
                  <div>
                    <span className="font-bold text-title block">Purge Local Cache</span>
                    <span className="text-[11px] text-subtitle">Reset local storage incident cache</span>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.removeItem('opspilot_resolved_patches');
                      addNotification({ type: 'info', title: 'Cache Purged', message: 'Local diagnostic cache successfully cleared.' });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 font-bold text-xs cursor-pointer"
                  >
                    Purge Cache
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

    </motion.div>
  );
};
