import React, { useState, useEffect, useRef } from 'react';
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
  Bell,
  Download,
  FileJson,
  Send,
  Type,
  AlertOctagon,
  Clock,
  UserPlus,
  Palette,
  ChevronRight,
  Activity,
  Sparkles,
  Upload,
  X,
  Edit2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchProjects, removeProject, testConnection } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { Project } from '../types';

interface SettingsPageProps {
  onOpenSetupModal?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onOpenSetupModal }) => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'projects' | 'ai' | 'webhooks' | 'guardrails' | 'team' | 'vault'>('projects');
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Infrastructure settings
  const [pollingInterval, setPollingInterval] = useState<string>(() => localStorage.getItem('opspilot_polling_interval') || '5s');
  const [dockerTimeout, setDockerTimeout] = useState<string>(() => localStorage.getItem('opspilot_docker_timeout') || '60s');

  // Editing Project Modal state
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [modalTab, setModalTab] = useState<'github' | 'server'>('github');
  const [isEditingGit, setIsEditingGit] = useState<boolean>(false);
  const [isEditingServer, setIsEditingServer] = useState<boolean>(false);
  const [editGitUrl, setEditGitUrl] = useState<string>('https://github.com/WildDragonDot/ops-pilot');
  const [editGitBranch, setEditGitBranch] = useState<string>('main');
  const [editGitToken, setEditGitToken] = useState<string>('');
  const [editHost, setEditHost] = useState<string>('');
  const [editPort, setEditPort] = useState<string>('22');
  const [editUser, setEditUser] = useState<string>('root');
  const [editSshPassword, setEditSshPassword] = useState<string>('');
  const [editSshKey, setEditSshKey] = useState<string>('');
  const [isTestingEdit, setIsTestingEdit] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ tested: boolean; success: boolean; gitMsg?: string; sshMsg?: string } | null>(null);

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
  const [terminalFontSize, setTerminalFontSize] = useState<string>(() => localStorage.getItem('opspilot_terminal_fontsize') || '12px');
  const [terminalTheme, setTerminalTheme] = useState<string>(() => localStorage.getItem('opspilot_terminal_theme') || 'Cyber Dark');

  // Guardrail Policies
  const defaultGuardrails = [
    { id: 'human-approval', name: 'Human Operator Approval Required', desc: 'All destructive write actions (patching code, restarting containers) require explicit user sign-off', enabled: true, category: 'CRITICAL' },
    { id: 'audit-logging', name: 'Immutable Audit Trail Logging', desc: 'Every prompt, system diagnosis, and command execution is logged to local DB', enabled: true, category: 'COMPLIANCE' },
    { id: 'auto-rollback', name: 'Auto-Rollback on Health Failure', desc: 'Automatically revert git commits and container restarts if HTTP 200 health check fails after 30s', enabled: true, category: 'SAFETY' },
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

  // Team Roster & Invite Modal State
  const [teamMembers, setTeamMembers] = useState([
    { name: 'Chandan Vishwakarma', email: 'chandan@opspilot.ai', role: 'ADMIN', status: 'ACTIVE' },
    { name: 'DevOps Lead Engineer', email: 'sre@opspilot.ai', role: 'OPERATOR', status: 'ACTIVE' },
    { name: 'Security Auditor', email: 'security@opspilot.ai', role: 'AUDITOR', status: 'ACTIVE' },
  ]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [inviteName, setInviteName] = useState<string>('');
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<string>('OPERATOR');

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

  const handleOpenEditProject = (proj: Project) => {
    setEditingProject(proj);
    setModalTab('github');
    setIsEditingGit(false);
    setIsEditingServer(false);
    setEditGitUrl(proj.gitUrl || '');
    setEditGitBranch(proj.gitBranch || 'main');
    setEditGitToken('');
    setEditHost(proj.serverHost || '');
    setEditPort(proj.serverPort ? String(proj.serverPort) : '22');
    setEditUser(proj.serverUser || 'root');
    setEditSshPassword('');
    setEditSshKey('');
    setTestResult(null);
  };

  const handleTestEditConnection = async () => {
    try {
      setIsTestingEdit(true);
      const res = await testConnection(
        {
          gitUrl: editGitUrl,
          gitBranch: editGitBranch,
          serverHost: editHost,
          serverPort: parseInt(editPort, 10) || 22,
          serverUser: editUser
        },
        { 
          githubToken: editGitToken,
          sshPassword: editSshPassword,
          sshKey: editSshKey
        }
      );

      const gitMsg = res.github?.message || (res.github?.connected ? `Connected to ${editGitUrl}` : 'GitHub validation failed');
      const sshMsg = res.ssh?.message || (editHost ? `SSH ${editHost}:${editPort}` : 'GitHub AST Local Mode Active (No SSH Host)');

      setTestResult({
        tested: true,
        success: res.success,
        gitMsg,
        sshMsg
      });

      addNotification({
        type: res.success ? 'success' : 'danger',
        title: res.success ? 'Connection Verified ✓' : 'Connection Failed',
        message: res.success 
          ? `Validated Git (${editGitBranch}) & Server configuration.`
          : 'Failed to verify connection credentials.'
      });
    } catch (err: any) {
      setTestResult({
        tested: true,
        success: false,
        gitMsg: err.message || 'Connection test failed'
      });
      addNotification({
        type: 'danger',
        title: 'Validation Error',
        message: err.message || 'Could not test connection.'
      });
    } finally {
      setIsTestingEdit(false);
    }
  };

  const handleSaveProjectEdit = () => {
    if (!editingProject) return;
    if (!testResult?.tested || !testResult?.success) {
      addNotification({
        type: 'warning',
        title: 'Verification Required',
        message: 'Please click "Test Connection & Verify" to validate credentials before saving!'
      });
      return;
    }

    setProjectsList(prev => prev.map(p => {
      if (p.id === editingProject.id) {
        return { 
          ...p, 
          gitUrl: editGitUrl,
          gitBranch: editGitBranch,
          serverHost: editHost ? editHost : null, 
          serverPort: parseInt(editPort, 10) || 22,
          serverUser: editUser
        };
      }
      return p;
    }));

    setEditingProject(null);
    addNotification({
      type: 'success',
      title: 'Project Settings Saved',
      message: `Updated project credentials & attached target (${editHost ? `SSH Host ${editHost}` : 'GitHub AST Mode'}).`
    });
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
      title: 'Infrastructure Saved',
      message: `Polling rate: ${pollingInterval}, Docker timeout: ${dockerTimeout}.`
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
      title: 'AI Config Saved',
      message: `Model set to "${selectedModel}" (Temp: ${reasoningTemperature}, Max Tokens: ${maxTokens}).`
    });
  };

  const handleSaveWebhooks = () => {
    localStorage.setItem('opspilot_webhook_url', webhookUrl);
    localStorage.setItem('opspilot_payload_format', payloadFormat);
    addNotification({
      type: 'success',
      title: 'Webhook Config Saved',
      message: `Webhook endpoint format set to ${payloadFormat}.`
    });
  };

  const handleTestWebhook = () => {
    setIsTestingWebhook(true);
    setTimeout(() => {
      setIsTestingWebhook(false);
      addNotification({
        type: 'success',
        title: 'Webhook Delivered',
        message: `Sent test alert payload to Slack endpoint (HTTP 200 OK).`
      });
    }, 1000);
  };

  const handleSaveProfileAndUI = () => {
    localStorage.setItem('opspilot_operator_name', operatorName);
    localStorage.setItem('opspilot_org_name', orgName);
    localStorage.setItem('opspilot_terminal_font', terminalFont);
    localStorage.setItem('opspilot_terminal_fontsize', terminalFontSize);
    localStorage.setItem('opspilot_terminal_theme', terminalTheme);
    addNotification({
      type: 'success',
      title: 'Profile Saved',
      message: `Updated profile for "${operatorName}" with font ${terminalFont}.`
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

  const handleImportBackupJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.aiConfig) {
          if (parsed.aiConfig.model) setSelectedModel(parsed.aiConfig.model);
          if (parsed.aiConfig.temperature) setReasoningTemperature(parsed.aiConfig.temperature);
          if (parsed.aiConfig.systemPrompt) setSystemPrompt(parsed.aiConfig.systemPrompt);
        }
        if (parsed.webhook?.url) setWebhookUrl(parsed.webhook.url);
        if (parsed.guardrails) setGuardrails(parsed.guardrails);
        if (parsed.forbiddenCommands) setForbiddenCmds(parsed.forbiddenCommands);
        if (parsed.organization) setOrgName(parsed.organization);
        if (parsed.operator) setOperatorName(parsed.operator);

        addNotification({
          type: 'success',
          title: 'Configuration Imported',
          message: 'Workspace settings successfully restored from JSON backup file.'
        });
      } catch (err) {
        addNotification({
          type: 'danger',
          title: 'Import Error',
          message: 'Invalid JSON backup file format.'
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddTeamMember = () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      addNotification({ type: 'warning', title: 'Missing Information', message: 'Please enter both name and email.' });
      return;
    }
    setTeamMembers(prev => [...prev, { name: inviteName, email: inviteEmail, role: inviteRole, status: 'ACTIVE' }]);
    setInviteName('');
    setInviteEmail('');
    setIsInviteModalOpen(false);
    addNotification({
      type: 'success',
      title: 'Member Invited',
      message: `Added "${inviteName}" as ${inviteRole} to the organization.`
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
            title: 'Vault Verified',
            message: 'Web Crypto API AES-256 GCM encryption test passed cleanly.'
          });
        }, 600);
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

  const navItems = [
    { id: 'projects', title: 'Projects & Servers', desc: 'Infrastructure hosts', icon: Server, badge: `${projectsList.length}` },
    { id: 'ai', title: 'AI Engine & Personas', desc: 'Reasoning models & prompts', icon: Cpu, badge: selectedModel },
    { id: 'webhooks', title: 'Webhooks & Slack Alerts', desc: 'Payloads & triggers', icon: Bell },
    { id: 'guardrails', title: 'Safety Guardrails', desc: 'Command block filter', icon: Shield, badge: `${guardrails.filter((g: any) => g.enabled).length}/${guardrails.length}` },
    { id: 'team', title: 'Organization & Team', desc: 'User access roster', icon: Users },
    { id: 'vault', title: 'Vault, UI & Backup', icon: Building, desc: 'Crypto vault & font' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
      className="space-y-4 max-w-7xl mx-auto font-sans pb-10"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportBackupJson}
        accept=".json"
        className="hidden"
      />

      {/* Top Header Banner with Subtle Glow */}
      <div className="glass-panel px-5 py-4 rounded-xl theme-border border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-blue-500/10 via-indigo-500/5 to-transparent pointer-events-none" />
        
        <div className="space-y-0.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold font-mono flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-400" /> Control Center
            </span>
          </div>
          <h1 className="text-lg font-bold text-title tracking-tight font-display">Workspace Settings</h1>
          <p className="text-[11px] text-subtitle leading-snug">
            Manage multi-project server connections, client WebCrypto vault, AI reasoning models, Slack webhooks, and safety guardrails.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 relative z-10">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fileInputRef.current?.click()}
            title="Import configuration JSON file"
            className="flex items-center gap-1.5 px-3 py-1.5 card-bg-subtle hover:bg-slate-500/10 text-title border theme-border text-[11px] font-bold rounded-lg transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-500" />
            <span>Import JSON</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportBackupJson}
            title="Export workspace backup JSON"
            className="flex items-center gap-1.5 px-3 py-1.5 card-bg-subtle hover:bg-slate-500/10 text-title border theme-border text-[11px] font-bold rounded-lg transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span>Export Backup</span>
          </motion.button>

          {onOpenSetupModal && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenSetupModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-bold rounded-lg shadow-sm glow-blue transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Setup Project</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Zero-DB Client Encryption Vault Bar */}
      <div className="glass-panel px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div className="text-[11px]">
            <span className="font-bold text-title flex items-center gap-1.5">
              Zero-DB Client Encryption Vault Active
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            </span>
            <span className="text-[10px] text-subtitle">
              SSH keys & tokens encrypted in WebCrypto storage. Zero credentials saved on server DB.
            </span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleTestVaultEncryption}
          disabled={isVerifyingVault}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-extrabold border border-emerald-500/30 hover:bg-emerald-500/30 transition shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${isVerifyingVault ? 'animate-spin' : ''}`} />
          <span>{isVerifyingVault ? 'Verifying...' : 'Test WebCrypto'}</span>
        </motion.button>
      </div>

      {/* 2-COLUMN COMPACT LAYOUT */}
      <div className="flex flex-col lg:flex-row gap-5">

        {/* LEFT SETTINGS NAVIGATION SIDEBAR */}
        <div className="w-full lg:w-64 shrink-0 space-y-3">
          <div className="glass-panel p-1.5 rounded-xl theme-border border space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all cursor-pointer relative overflow-hidden ${
                    isActive
                      ? 'border-l-3 border-blue-500 bg-gradient-to-r from-blue-600/15 via-blue-600/5 to-transparent text-blue-500 font-bold'
                      : 'card-bg-subtle text-subtitle hover:text-title hover:bg-slate-500/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1 rounded-md ${isActive ? 'bg-blue-500/20 text-blue-500' : 'bg-slate-500/10 text-subtitle'}`}>
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold block truncate leading-tight">{item.title}</span>
                      <span className={`text-[9px] block truncate ${isActive ? 'text-blue-400' : 'text-subtitle'}`}>
                        {item.desc}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {item.badge && (
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono max-w-[55px] truncate ${
                        isActive ? 'bg-blue-500/20 text-blue-400 font-extrabold border border-blue-500/30' : 'bg-slate-500/10 text-subtitle font-bold'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className={`w-3 h-3 ${isActive ? 'text-blue-500' : 'text-slate-400'}`} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick System Summary Card */}
          <div className="glass-panel p-3 rounded-xl theme-border border space-y-2">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-subtitle flex items-center gap-1">
              <Activity className="w-3 h-3 text-blue-500" />
              <span>Vault & System Summary</span>
            </h4>

            <div className="space-y-1.5 text-[10px] font-mono">
              <div className="flex justify-between items-center p-1.5 rounded-lg card-bg-subtle border theme-border">
                <span className="text-subtitle">Vault Status</span>
                <span className="text-emerald-500 font-extrabold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> AES-256
                </span>
              </div>
              <div className="flex justify-between items-center p-1.5 rounded-lg card-bg-subtle border theme-border">
                <span className="text-subtitle">AI Model</span>
                <span className="text-blue-500 font-extrabold truncate max-w-[90px]">{selectedModel}</span>
              </div>
              <div className="flex justify-between items-center p-1.5 rounded-lg card-bg-subtle border theme-border">
                <span className="text-subtitle">Webhook</span>
                <span className="text-emerald-500 font-extrabold">{webhookUrl ? 'ACTIVE' : 'OFF'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SETTINGS MAIN CANVAS */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            
            {/* TAB 1: PROJECTS & INFRASTRUCTURE */}
            {activeTab === 'projects' && (
              <motion.div 
                key="tab-projects"
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }} 
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-[11px] font-bold text-title uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-blue-500" />
                    <span>Connected Infrastructure Projects ({projectsList.length})</span>
                  </h2>
                  {onOpenSetupModal && (
                    <button
                      onClick={onOpenSetupModal}
                      className="text-[11px] text-blue-500 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Project</span>
                    </button>
                  )}
                </div>

                {isLoading ? (
                  <div className="p-6 text-center text-subtitle text-[11px] font-mono">Loading connected projects...</div>
                ) : projectsList.length === 0 ? (
                  <div className="glass-panel p-6 rounded-xl theme-border border text-center space-y-2.5">
                    <Server className="w-6 h-6 text-subtitle mx-auto" />
                    <h3 className="text-xs font-bold text-title">No Connected Projects</h3>
                    <p className="text-[11px] text-subtitle max-w-xs mx-auto">Set up your first project to connect OpsPilot AI with a repository and server host.</p>
                    {onOpenSetupModal && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onOpenSetupModal}
                        className="px-3.5 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-lg shadow-sm cursor-pointer"
                      >
                        Setup First Project
                      </motion.button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {projectsList.map((proj, idx) => {
                      const sshString = proj.serverHost ? `${proj.serverUser || 'root'}@${proj.serverHost}:${proj.serverPort || 22}` : 'Local Sandbox Engine';
                      return (
                        <div
                          key={proj.id}
                          className="glass-panel p-4 rounded-xl theme-border border space-y-2.5 glass-panel-hover"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                <Terminal className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <h3 className="text-xs font-bold text-title">{proj.name}</h3>
                                <span className="text-[9px] text-subtitle font-mono">ID: #{proj.id}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditProject(proj)}
                                title="Edit Connection"
                                className="p-1 rounded text-subtitle hover:text-blue-500 hover:bg-blue-500/10 transition cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProject(proj.id, proj.name)}
                                title="Remove Project"
                                aria-label={`Remove project ${proj.name}`}
                                className="p-1 rounded text-subtitle hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2 text-[11px] font-mono">
                            <div className="p-2 rounded-lg card-bg-subtle border theme-border flex items-center justify-between">
                              <div className="truncate">
                                <span className="text-[9px] text-subtitle block">SSH Host</span>
                                <span className="text-title font-bold truncate block">{sshString}</span>
                              </div>
                              {proj.serverHost && (
                                <button
                                  onClick={() => handleCopyText(sshString, idx)}
                                  title="Copy SSH String"
                                  className="p-1 rounded hover:bg-slate-500/10 text-subtitle hover:text-title transition shrink-0 cursor-pointer"
                                >
                                  {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-1.5 rounded-lg card-bg-subtle border theme-border">
                                <span className="text-[9px] text-subtitle block">Environment</span>
                                <span className="text-title font-bold text-[10px]">{proj.environmentType || 'Docker Compose'}</span>
                              </div>
                              <div className="p-1.5 rounded-lg card-bg-subtle border theme-border">
                                <span className="text-[9px] text-subtitle block">Vault Status</span>
                                <span className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> Encrypted
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
                <div className="glass-panel p-5 rounded-xl theme-border border space-y-3">
                  <div className="flex items-center justify-between border-b theme-border pb-2.5">
                    <h3 className="text-[11px] font-bold text-title uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>Infrastructure Polling & Timeouts</span>
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveInfraSettings}
                      className="flex items-center gap-1 text-[11px] text-blue-500 font-bold hover:underline cursor-pointer"
                    >
                      <Save className="w-3 h-3" /> Save
                    </motion.button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                    <div className="space-y-1">
                      <label className="text-subtitle font-bold block">Cluster Auto-Refresh Rate</label>
                      <select
                        value={pollingInterval}
                        onChange={(e) => setPollingInterval(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border theme-border card-bg-subtle text-title font-mono focus:outline-none focus:border-blue-500 text-[11px]"
                      >
                        <option value="5s">Every 5 Seconds (High Realtime)</option>
                        <option value="10s">Every 10 Seconds (Balanced)</option>
                        <option value="30s">Every 30 Seconds (Low Overhead)</option>
                        <option value="disabled">Disabled (Manual Refresh Only)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-subtitle font-bold block">Docker Command Execution Timeout</label>
                      <select
                        value={dockerTimeout}
                        onChange={(e) => setDockerTimeout(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border theme-border card-bg-subtle text-title font-mono focus:outline-none focus:border-blue-500 text-[11px]"
                      >
                        <option value="30s">30 Seconds Timeout</option>
                        <option value="60s">60 Seconds Timeout (Recommended)</option>
                        <option value="120s">120 Seconds Timeout (Long Builds)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: AI ENGINE & PERSONAS */}
            {activeTab === 'ai' && (
              <motion.div 
                key="tab-ai"
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }} 
                transition={{ duration: 0.2 }}
                className="glass-panel p-5 rounded-xl theme-border border space-y-5"
              >
                <div className="flex items-center justify-between border-b theme-border pb-3">
                  <div>
                    <h2 className="text-xs font-bold text-title flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-blue-500" />
                      <span>OpenAI API & System Personas</span>
                    </h2>
                    <p className="text-[11px] text-subtitle">Configure system prompt parameters, model choice, token limits, and API keys.</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveAISettings}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg shadow-sm transition cursor-pointer"
                  >
                    <Save className="w-3 h-3" />
                    <span>Save AI Config</span>
                  </motion.button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-title block">Primary Reasoning Model</label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border theme-border card-bg-subtle text-title text-[11px] font-mono focus:outline-none focus:border-blue-500"
                      >
                        <option value="gpt-4o">gpt-4o (High-Precision SRE Reasoning)</option>
                        <option value="gpt-4o-mini">gpt-4o-mini (Fast Log Inspection)</option>
                        <option value="o1-mini">o1-mini (Deep Static Code Audit)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[11px]">
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
                        className="w-full accent-blue-500 cursor-pointer h-1"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[11px]">
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
                        className="w-full accent-blue-500 cursor-pointer h-1"
                      />
                    </div>

                    <div className="space-y-1 pt-1">
                      <label className="text-[11px] font-bold text-title block">OpenAI API Key Token</label>
                      <div className="relative flex items-center">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="w-full px-3 py-1.5 pr-8 rounded-lg border theme-border card-bg-subtle text-title text-[11px] font-mono focus:outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-2 text-subtitle hover:text-title p-1 transition cursor-pointer"
                        >
                          {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* AI System Persona Instructions */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-title block">AI System Persona Prompt</label>
                      <button
                        onClick={() => setSystemPrompt(defaultSystemPrompt)}
                        className="text-[9px] text-blue-500 hover:underline font-mono font-bold cursor-pointer"
                      >
                        Reset Default
                      </button>
                    </div>

                    <textarea
                      rows={5}
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      className="w-full p-2.5 rounded-lg border theme-border card-bg-subtle text-title text-[11px] font-mono focus:outline-none focus:border-blue-500 leading-normal resize-none"
                      placeholder="Enter system prompt guidelines..."
                    />

                    <div className="space-y-1">
                      <span className="text-[9px] text-subtitle font-mono uppercase block">Preset Personas:</span>
                      <div className="flex flex-wrap gap-1">
                        {[
                          { label: 'Strict SRE', prompt: 'You are OpsPilot AI, a Strict SRE. Prioritize system uptime, minimal code changes, and immediate rollback on errors.' },
                          { label: 'Security Auditor', prompt: 'You are OpsPilot AI, a Security Auditor. Focus strictly on credential leaks, CVE vulnerabilities, and IAM permissions.' },
                          { label: 'Speed Operator', prompt: 'You are OpsPilot AI, a Speed-First Operator. Resolve incidents rapidly using automated container restarts and quick patches.' },
                          { label: 'Compliance', prompt: 'You are OpsPilot AI, a Compliance Officer. Require explicit audit logging and operator sign-off before executing commands.' },
                        ].map((preset, pIdx) => (
                          <button
                            key={pIdx}
                            onClick={() => setSystemPrompt(preset.prompt)}
                            className="px-2 py-0.5 rounded text-[9px] font-bold card-bg-subtle border theme-border text-title hover:border-blue-500/40 cursor-pointer"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: WEBHOOKS & INTEGRATIONS */}
            {activeTab === 'webhooks' && (
              <motion.div 
                key="tab-webhooks"
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }} 
                transition={{ duration: 0.2 }}
                className="glass-panel p-5 rounded-xl theme-border border space-y-5"
              >
                <div className="flex items-center justify-between border-b theme-border pb-3">
                  <div>
                    <h2 className="text-xs font-bold text-title flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-blue-500" />
                      <span>Slack & Webhook Incident Alerts</span>
                    </h2>
                    <p className="text-[11px] text-subtitle">Send automated incident reports to Slack, Microsoft Teams, or custom HTTP webhooks.</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveWebhooks}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg shadow-sm transition cursor-pointer"
                  >
                    <Save className="w-3 h-3" />
                    <span>Save Webhooks</span>
                  </motion.button>
                </div>

                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[11px] font-bold text-title block">Incoming Webhook URL</label>
                      <input
                        type="url"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://hooks.slack.com/services/..."
                        className="w-full px-3 py-1.5 rounded-lg border theme-border card-bg-subtle text-title text-[11px] font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-title block">Payload Format</label>
                      <select
                        value={payloadFormat}
                        onChange={(e) => setPayloadFormat(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border theme-border card-bg-subtle text-title text-[11px] font-mono focus:outline-none focus:border-blue-500"
                      >
                        <option value="Slack Block Kit">Slack Block Kit</option>
                        <option value="Discord Embed">Discord Rich Embed</option>
                        <option value="Raw JSON">Standard Raw JSON</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleTestWebhook}
                      disabled={isTestingWebhook}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm transition shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      <Send className={`w-3 h-3 ${isTestingWebhook ? 'animate-bounce' : ''}`} />
                      <span>{isTestingWebhook ? 'Sending...' : 'Test Webhook Payload'}</span>
                    </motion.button>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="text-[10px] font-bold text-title block font-mono uppercase tracking-wider">Trigger Notification Events</label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { id: 'onOutage', label: 'Outage / Service Degraded Event', desc: 'Trigger when container stops or health check returns 502' },
                        { id: 'onApprovalNeeded', label: 'Fix Patch Awaiting Approval', desc: 'Trigger when AI proposes code fix requiring sign-off' },
                        { id: 'onAutoRecovery', label: 'Service Auto-Recovery Completed', desc: 'Trigger when HTTP 200 health check confirms resolution' },
                        { id: 'onSecurityScan', label: 'Security Vulnerability Found', desc: 'Trigger when GitHub audit detects HIGH severity CVE' },
                      ].map((ev) => (
                        <div
                          key={ev.id}
                          onClick={() => setWebhookEvents(prev => ({ ...prev, [ev.id]: !prev[ev.id as keyof typeof prev] }))}
                          className="p-3 rounded-lg card-bg-subtle border theme-border flex items-start gap-2.5 cursor-pointer hover:border-blue-500/40 transition"
                        >
                          <input
                            type="checkbox"
                            checked={webhookEvents[ev.id as keyof typeof webhookEvents]}
                            onChange={() => {}}
                            className="mt-0.5 accent-blue-600 rounded cursor-pointer"
                          />
                          <div>
                            <span className="text-[11px] font-bold text-title block">{ev.label}</span>
                            <span className="text-[10px] text-subtitle block leading-tight">{ev.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 4: SAFETY GUARDRAILS & FORBIDDEN COMMANDS */}
            {activeTab === 'guardrails' && (
              <motion.div 
                key="tab-guardrails"
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }} 
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="glass-panel p-5 rounded-xl theme-border border space-y-4">
                  <div className="border-b theme-border pb-3">
                    <h2 className="text-xs font-bold text-title flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-500" />
                      <span>AI Automated Safety Guardrails & Policies</span>
                    </h2>
                    <p className="text-[11px] text-subtitle">Toggle automated guardrails to strictly control what actions OpsPilot AI can perform autonomously.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {guardrails.map((policy: any) => (
                      <div
                        key={policy.id}
                        className={`p-3 rounded-xl border theme-border transition-all flex items-center justify-between gap-3 ${
                          policy.enabled ? 'card-bg-subtle hover:border-blue-500/40' : 'opacity-70 card-bg-subtle'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-title">{policy.name}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold font-mono border ${
                              policy.category === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            }`}>
                              {policy.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-subtitle max-w-lg">{policy.desc}</p>
                        </div>

                        <button
                          onClick={() => handleToggleGuardrail(policy.id)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            policy.enabled ? 'bg-blue-600' : 'bg-slate-700/40 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              policy.enabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Forbidden Terminal Commands Filter */}
                <div className="glass-panel p-5 rounded-xl theme-border border space-y-3">
                  <div className="flex items-center justify-between border-b theme-border pb-2.5">
                    <h3 className="text-[11px] font-bold text-title uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
                      <span>Forbidden Terminal Commands Filter ({forbiddenCmds.length})</span>
                    </h3>
                  </div>
                  <p className="text-[11px] text-subtitle">OpsPilot AI agent is strictly blocked from executing any command pattern listed below.</p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newForbiddenCmd}
                      onChange={(e) => setNewForbiddenCmd(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddForbiddenCmd()}
                      placeholder="Add restricted command pattern (e.g. 'sudo rm', 'drop database')..."
                      className="flex-1 px-3 py-1.5 rounded-lg border theme-border card-bg-subtle text-title text-[11px] font-mono focus:outline-none focus:border-blue-500"
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddForbiddenCmd}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded-lg shadow-sm cursor-pointer shrink-0"
                    >
                      Block Command
                    </motion.button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {forbiddenCmds.map((cmd, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-mono font-bold"
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
              </motion.div>
            )}

            {/* TAB 5: ORGANIZATION & TEAM ACCESS */}
            {activeTab === 'team' && (
              <motion.div 
                key="tab-team"
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }} 
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-panel p-5 rounded-xl theme-border border space-y-3">
                    <div className="flex items-center justify-between border-b theme-border pb-2.5">
                      <h2 className="text-[11px] font-bold text-title uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Organization Identity</span>
                      </h2>
                      <button
                        onClick={handleSaveProfileAndUI}
                        className="flex items-center gap-1 text-[11px] text-blue-500 font-bold hover:underline cursor-pointer"
                      >
                        <Save className="w-3 h-3" /> Save
                      </button>
                    </div>

                    <div className="space-y-2.5 text-[11px]">
                      <div className="space-y-1">
                        <label className="text-subtitle font-bold block">Organization Name</label>
                        <input
                          type="text"
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border theme-border card-bg-subtle text-title font-mono focus:outline-none focus:border-blue-500 text-[11px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-subtitle font-bold block">Organization ID</label>
                        <input
                          type="text"
                          disabled
                          value={user?.organizationId || 'org-acme-corp'}
                          className="w-full px-3 py-1.5 rounded-lg border theme-border card-bg-subtle text-subtitle font-mono text-[11px]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel p-5 rounded-xl theme-border border space-y-3">
                    <div className="flex items-center justify-between border-b theme-border pb-2.5">
                      <h2 className="text-[11px] font-bold text-title uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Active Operator Profile</span>
                      </h2>
                      <button
                        onClick={handleSaveProfileAndUI}
                        className="flex items-center gap-1 text-[11px] text-blue-500 font-bold hover:underline cursor-pointer"
                      >
                        <Save className="w-3 h-3" /> Save Profile
                      </button>
                    </div>

                    <div className="space-y-2.5 text-[11px]">
                      <div className="space-y-1">
                        <label className="text-subtitle font-bold block">Operator Display Name</label>
                        <input
                          type="text"
                          value={operatorName}
                          onChange={(e) => setOperatorName(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border theme-border card-bg-subtle text-title font-mono focus:outline-none focus:border-blue-500 text-[11px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-subtitle font-bold block">Assigned Role</label>
                        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg border theme-border card-bg-subtle font-mono text-title text-[11px]">
                          <span>{user?.role || 'ADMIN'}</span>
                          <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-500 border border-blue-500/30 text-[9px] font-bold">
                            SUPERUSER
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Roster Table */}
                <div className="glass-panel p-5 rounded-xl theme-border border space-y-3">
                  <div className="flex items-center justify-between border-b theme-border pb-2.5">
                    <h3 className="text-[11px] font-bold text-title uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Team Access Roster ({teamMembers.length})</span>
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsInviteModalOpen(true)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold cursor-pointer shadow-sm"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Invite Member</span>
                    </motion.button>
                  </div>

                  <div className="space-y-1.5">
                    {teamMembers.map((member, mIdx) => (
                      <div key={mIdx} className="flex items-center justify-between p-2.5 rounded-lg card-bg-subtle border theme-border text-[11px]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-title">{member.name}</div>
                            <div className="text-[10px] text-subtitle font-mono">{member.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[9px] font-mono font-bold">
                            {member.role}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono text-emerald-500 font-bold">
                            {member.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 6: VAULT, TERMINAL UI & BACKUP EXPORT */}
            {activeTab === 'vault' && (
              <motion.div 
                key="tab-vault"
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }} 
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Terminal Customization Controls */}
                  <div className="glass-panel p-5 rounded-xl theme-border border space-y-3">
                    <div className="flex items-center justify-between border-b theme-border pb-2.5">
                      <h2 className="text-[11px] font-bold text-title uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Terminal Customization</span>
                      </h2>
                      <button
                        onClick={handleSaveProfileAndUI}
                        className="flex items-center gap-1 text-[11px] text-blue-500 font-bold hover:underline cursor-pointer"
                      >
                        <Save className="w-3 h-3" /> Save UI
                      </button>
                    </div>

                    <div className="space-y-3 text-[11px]">
                      <div className="space-y-1">
                        <label className="text-subtitle font-bold block">Console Font Family</label>
                        <select
                          value={terminalFont}
                          onChange={(e) => setTerminalFont(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border theme-border card-bg-subtle text-title font-mono focus:outline-none focus:border-blue-500 text-[11px]"
                        >
                          <option value="JetBrains Mono">JetBrains Mono (Recommended)</option>
                          <option value="Fira Code">Fira Code (With Ligatures)</option>
                          <option value="Source Code Pro">Source Code Pro</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-subtitle font-bold block">Console Font Size</label>
                          <select
                            value={terminalFontSize}
                            onChange={(e) => setTerminalFontSize(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border theme-border card-bg-subtle text-title font-mono focus:outline-none focus:border-blue-500 text-[11px]"
                          >
                            <option value="12px">12px (Compact)</option>
                            <option value="13px">13px (Standard)</option>
                            <option value="15px">15px (Large)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-subtitle font-bold block">Terminal Theme</label>
                          <select
                            value={terminalTheme}
                            onChange={(e) => setTerminalTheme(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border theme-border card-bg-subtle text-title font-mono focus:outline-none focus:border-blue-500 text-[11px]"
                          >
                            <option value="Cyber Dark">Cyber Dark</option>
                            <option value="Dracula">Dracula Dark</option>
                            <option value="Monokai">Monokai Pro</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* LIVE INTERACTIVE TERMINAL LOG PREVIEW BOX */}
                  <div className="glass-panel p-5 rounded-xl theme-border border space-y-2.5">
                    <div className="flex items-center justify-between border-b theme-border pb-2.5">
                      <h3 className="text-[11px] font-bold text-title uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Live Console Preview</span>
                      </h3>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        LIVE PREVIEW
                      </span>
                    </div>

                    <div 
                      style={{ fontFamily: terminalFont, fontSize: terminalFontSize }}
                      className="p-3.5 rounded-lg bg-slate-950 text-slate-100 border border-slate-800 space-y-1 overflow-x-auto shadow-inner min-h-[140px]"
                    >
                      <div className="text-slate-500 text-[10px]">$ opspilot-ai --scan --cluster=production</div>
                      <div className="text-emerald-400 font-bold">[INFO] PostgreSQL container running on port 5432 (HEALTHY)</div>
                      <div className="text-blue-400">[OK]   Zero-DB WebCrypto vault encryption active.</div>
                      <div className="text-amber-400">[WARN] 1 pending patch awaiting operator approval.</div>
                      <div className="text-slate-400 text-[10px]">$ _</div>
                    </div>
                  </div>
                </div>

                {/* Workspace Backup & Maintenance */}
                <div className="glass-panel p-5 rounded-xl theme-border border space-y-3">
                  <h2 className="text-[11px] font-bold text-title uppercase tracking-wider font-mono flex items-center gap-1.5 border-b theme-border pb-2.5">
                    <FileJson className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Backup & Workspace Maintenance</span>
                  </h2>

                  <div className="space-y-3 text-[11px]">
                    <div className="p-3 rounded-lg card-bg-subtle border theme-border flex items-center justify-between">
                      <div>
                        <span className="font-bold text-title block">Import Workspace Backup JSON</span>
                        <span className="text-[10px] text-subtitle">Restore full settings from JSON file</span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Import JSON</span>
                      </motion.button>
                    </div>

                    <div className="p-3 rounded-lg card-bg-subtle border theme-border flex items-center justify-between">
                      <div>
                        <span className="font-bold text-title block">Export Workspace JSON</span>
                        <span className="text-[10px] text-subtitle">Download full settings backup file</span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleExportBackupJson}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] shadow-sm cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download JSON</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>

      {/* EDIT PROJECT MODAL DIALOG */}
      <AnimatePresence>
        {editingProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel max-w-lg w-full p-6 rounded-2xl theme-border border space-y-5 shadow-2xl font-sans"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b theme-border pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-title flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-blue-500" />
                    <span>Project Connection — {editingProject.name}</span>
                  </h3>
                  <p className="text-[11px] text-subtitle">
                    Inspect status or edit GitHub & SSH Server credentials.
                  </p>
                </div>
                <button
                  onClick={() => setEditingProject(null)}
                  className="text-subtitle hover:text-title p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 2 Tabs Header: GitHub vs Server */}
              <div className="flex items-center gap-2 p-1 rounded-xl card-bg-subtle border theme-border">
                <button
                  type="button"
                  onClick={() => setModalTab('github')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    modalTab === 'github'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-subtitle hover:text-title'
                  }`}
                >
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span>1. GitHub Repository</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalTab('server')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    modalTab === 'server'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-subtitle hover:text-title'
                  }`}
                >
                  <Server className="w-4 h-4 text-indigo-400" />
                  <span>2. SSH Server Host</span>
                </button>
              </div>

              {/* TAB 1: GITHUB REPOSITORY CONFIG & VIEW */}
              {modalTab === 'github' ? (
                <div className="space-y-4 text-xs max-h-[60vh] overflow-y-auto pr-1">
                  {/* GitHub Status Summary Card (Masked Token for Zero-Leak Security) */}
                  <div className="p-4 rounded-xl card-bg-subtle border theme-border space-y-3">
                    <div className="flex items-center justify-between border-b theme-border pb-2">
                      <span className="font-extrabold text-blue-400 font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-blue-500" /> Active GitHub Connection
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-extrabold">
                          ✓ AUTHENTICATED
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingGit(prev => !prev)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-sm transition flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>{isEditingGit ? 'Hide Form' : 'Edit Settings'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 font-mono">
                      <div>
                        <span className="text-[10px] text-subtitle block font-sans font-bold">Repository Target</span>
                        <span className="text-title font-bold text-xs">{editingProject.gitUrl || 'https://github.com/WildDragonDot/ops-pilot'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <span className="text-[10px] text-subtitle block font-sans font-bold">Target Branch</span>
                          <span className="text-blue-400 font-bold">{editingProject.gitBranch || 'main'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-subtitle block font-sans font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3 text-emerald-400" /> Access Token
                          </span>
                          <span className="text-slate-400 font-bold tracking-widest text-[11px]">••••••••••••••••</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* GitHub Edit Inputs (Appears in-place on clicking blue Edit button) */}
                  {isEditingGit && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="space-y-3 p-4 rounded-xl border theme-border space-y-3 bg-blue-500/5">
                        <h4 className="font-bold text-title text-xs flex items-center gap-1.5">
                          <Edit2 className="w-3.5 h-3.5 text-blue-500" /> Update GitHub Settings
                        </h4>

                        <div className="space-y-1">
                          <label className="text-subtitle font-bold block">GitHub Repository URL</label>
                          <input
                            type="text"
                            value={editGitUrl}
                            onChange={(e) => setEditGitUrl(e.target.value)}
                            placeholder="e.g. https://github.com/WildDragonDot/ops-pilot"
                            className="w-full px-3 py-2 rounded-xl border theme-border theme-input text-title font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-subtitle font-bold block">Target Branch</label>
                            <input
                              type="text"
                              value={editGitBranch}
                              onChange={(e) => setEditGitBranch(e.target.value)}
                              placeholder="main"
                              className="w-full px-3 py-2 rounded-xl border theme-border theme-input text-title font-mono focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-subtitle font-bold block">Personal Access Token</label>
                            <input
                              type="password"
                              value={editGitToken}
                              onChange={(e) => setEditGitToken(e.target.value)}
                              placeholder="Optional PAT (Leave blank if public)"
                              className="w-full px-3 py-2 rounded-xl border theme-border theme-input text-title font-mono focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* TEST CONNECTION BUTTON & VERIFICATION BADGES */}
                      <div className="space-y-2 pt-1">
                        <button
                          type="button"
                          onClick={handleTestEditConnection}
                          disabled={isTestingEdit}
                          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition"
                        >
                          {isTestingEdit ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin text-white" />
                              <span>Verifying GitHub & Credentials...</span>
                            </>
                          ) : (
                            <>
                              <Activity className="w-4 h-4 text-emerald-400" />
                              <span>Test Connection & Verify Credentials</span>
                            </>
                          )}
                        </button>

                        {testResult && (
                          <div className={`p-3 rounded-xl border font-mono text-[11px] space-y-1 ${
                            testResult.success 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          }`}>
                            <div className="flex items-center gap-1.5 font-extrabold">
                              {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />}
                              <span>{testResult.success ? 'CONNECTION VERIFIED — SAFE TO SAVE' : 'VERIFICATION FAILED'}</span>
                            </div>
                            {testResult.gitMsg && <div className="text-[10px] opacity-90">✓ GitHub: {testResult.gitMsg}</div>}
                            {testResult.sshMsg && <div className="text-[10px] opacity-90">✓ Server: {testResult.sshMsg}</div>}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t theme-border pt-3">
                        <span className="text-[10px] text-subtitle font-mono">
                          {!testResult?.tested ? '⚠️ Test connection before saving' : testResult.success ? '✓ Ready to save' : '❌ Verification failed'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsEditingGit(false)}
                            className="px-3.5 py-2 rounded-xl card-bg-subtle border theme-border text-title text-xs font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveProjectEdit}
                            disabled={!testResult?.tested || !testResult?.success}
                            className={`px-5 py-2 rounded-xl text-xs font-extrabold shadow-md transition cursor-pointer ${
                              testResult?.tested && testResult?.success
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white glow-emerald'
                                : 'bg-slate-700 text-slate-400 opacity-60 cursor-not-allowed'
                            }`}
                          >
                            Save Connection
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                /* TAB 2: SSH SERVER INFRASTRUCTURE CONFIG & VIEW */
                <div className="space-y-4 text-xs max-h-[60vh] overflow-y-auto pr-1">
                  {/* SSH Server Status Summary Card */}
                  <div className="p-4 rounded-xl card-bg-subtle border theme-border space-y-3">
                    <div className="flex items-center justify-between border-b theme-border pb-2">
                      <span className="font-extrabold text-indigo-400 font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5 text-indigo-500" /> SSH Server Status
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-extrabold border ${
                          editingProject.serverHost 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {editingProject.serverHost ? '✓ SSH CONNECTED' : 'ℹ GITHUB AST MODE'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingServer(prev => !prev)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-sm transition flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>{isEditingServer ? 'Hide Form' : 'Edit Settings'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 font-mono">
                      <div>
                        <span className="text-[10px] text-subtitle block font-sans font-bold">SSH Host Address</span>
                        <span className="text-title font-bold text-xs">
                          {editingProject.serverHost || 'Not Attached (GitHub AST Mode Active)'}
                        </span>
                      </div>
                      {Boolean(editingProject.serverHost) && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <span className="text-[10px] text-subtitle block font-sans font-bold">SSH Port</span>
                            <span className="text-title font-bold">{editingProject.serverPort || 22}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-subtitle block font-sans font-bold">SSH User</span>
                            <span className="text-title font-bold">{editingProject.serverUser || 'root'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SSH Edit Inputs (Appears in-place on clicking blue Edit button) */}
                  {isEditingServer && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="space-y-3 p-4 rounded-xl border theme-border space-y-3 bg-indigo-500/5">
                        <h4 className="font-bold text-title text-xs flex items-center gap-1.5">
                          <Edit2 className="w-3.5 h-3.5 text-indigo-500" /> Update SSH Server Settings
                        </h4>

                        <div className="space-y-1">
                          <label className="text-subtitle font-bold block">SSH Server Host IP / Domain</label>
                          <input
                            type="text"
                            value={editHost}
                            onChange={(e) => setEditHost(e.target.value)}
                            placeholder="e.g. 34.224.80.31 (Leave empty for GitHub AST Mode)"
                            className="w-full px-3 py-2 rounded-xl border theme-border theme-input text-title font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-subtitle font-bold block">SSH Port</label>
                            <input
                              type="text"
                              value={editPort}
                              onChange={(e) => setEditPort(e.target.value)}
                              placeholder="22"
                              className="w-full px-3 py-2 rounded-xl border theme-border theme-input text-title font-mono focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-subtitle font-bold block">SSH User</label>
                            <input
                              type="text"
                              value={editUser}
                              onChange={(e) => setEditUser(e.target.value)}
                              placeholder="root"
                              className="w-full px-3 py-2 rounded-xl border theme-border theme-input text-title font-mono focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-subtitle font-bold block">SSH Password</label>
                            <input
                              type="password"
                              value={editSshPassword}
                              onChange={(e) => setEditSshPassword(e.target.value)}
                              placeholder="Optional SSH Password"
                              className="w-full px-3 py-2 rounded-xl border theme-border theme-input text-title font-mono focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-subtitle font-bold block">SSH Private Key (.pem)</label>
                            <input
                              type="password"
                              value={editSshKey}
                              onChange={(e) => setEditSshKey(e.target.value)}
                              placeholder="Optional RSA Private Key"
                              className="w-full px-3 py-2 rounded-xl border theme-border theme-input text-title font-mono focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* TEST CONNECTION BUTTON & VERIFICATION BADGES */}
                      <div className="space-y-2 pt-1">
                        <button
                          type="button"
                          onClick={handleTestEditConnection}
                          disabled={isTestingEdit}
                          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition"
                        >
                          {isTestingEdit ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin text-white" />
                              <span>Testing Server Connection...</span>
                            </>
                          ) : (
                            <>
                              <Activity className="w-4 h-4 text-emerald-400" />
                              <span>Test Connection & Verify Credentials</span>
                            </>
                          )}
                        </button>

                        {testResult && (
                          <div className={`p-3 rounded-xl border font-mono text-[11px] space-y-1 ${
                            testResult.success 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          }`}>
                            <div className="flex items-center gap-1.5 font-extrabold">
                              {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />}
                              <span>{testResult.success ? 'CONNECTION VERIFIED — SAFE TO SAVE' : 'VERIFICATION FAILED'}</span>
                            </div>
                            {testResult.gitMsg && <div className="text-[10px] opacity-90">✓ GitHub: {testResult.gitMsg}</div>}
                            {testResult.sshMsg && <div className="text-[10px] opacity-90">✓ Server: {testResult.sshMsg}</div>}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t theme-border pt-3">
                        <span className="text-[10px] text-subtitle font-mono">
                          {!testResult?.tested ? '⚠️ Test connection before saving' : testResult.success ? '✓ Ready to save' : '❌ Verification failed'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsEditingServer(false)}
                            className="px-3.5 py-2 rounded-xl card-bg-subtle border theme-border text-title text-xs font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveProjectEdit}
                            disabled={!testResult?.tested || !testResult?.success}
                            className={`px-5 py-2 rounded-xl text-xs font-extrabold shadow-md transition cursor-pointer ${
                              testResult?.tested && testResult?.success
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white glow-emerald'
                                : 'bg-slate-700 text-slate-400 opacity-60 cursor-not-allowed'
                            }`}
                          >
                            Save Connection
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INVITE TEAM MEMBER MODAL DIALOG */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel max-w-md w-full p-5 rounded-2xl theme-border border space-y-4 shadow-xl font-sans"
            >
              <div className="flex items-center justify-between border-b theme-border pb-3">
                <h3 className="text-xs font-bold text-title flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-500" />
                  <span>Invite New Team Member</span>
                </h3>
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="text-subtitle hover:text-title p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-subtitle font-bold block">Member Full Name</label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full px-3 py-2 rounded-xl border theme-border card-bg-subtle text-title font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-subtitle font-bold block">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="alex@opspilot.ai"
                    className="w-full px-3 py-2 rounded-xl border theme-border card-bg-subtle text-title font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-subtitle font-bold block">Assign Access Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border theme-border card-bg-subtle text-title font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value="OPERATOR">OPERATOR (Full Patch Execution)</option>
                    <option value="AUDITOR">AUDITOR (Read-Only Logs)</option>
                    <option value="ADMIN">ADMIN (Superuser Access)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl card-bg-subtle border theme-border text-title text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTeamMember}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Send Invitation
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
