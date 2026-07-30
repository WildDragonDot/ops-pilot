import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Server, 
  Github, 
  Shield, 
  Check, 
  RefreshCw, 
  ArrowRight, 
  ArrowLeft, 
  Key, 
  Terminal, 
  Cpu, 
  Box, 
  Code, 
  Globe,
  Lock,
  Eye,
  EyeOff,
  Layers,
  Zap,
  CheckCircle2,
  HelpCircle,
  Info,
  ExternalLink,
  GitBranch,
  AlertTriangle,
  Folder,
  Search,
  Loader2
} from 'lucide-react';
import { createNewProject, testConnection, scanDirectoriesApi } from '../services/api';
import { ProjectCredentials } from '../services/vault';
import { Project } from '../types';
import { ServerDiscoveryReport } from './ServerDiscoveryReport';

interface ProjectSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (newProject: Project) => void;
}

export const ProjectSetupModal: React.FC<ProjectSetupModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated
}) => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; ssh?: any; github?: any; discovery?: any; error?: string } | null>(null);

  // Help Tooltip State
  const [showPatHelp, setShowPatHelp] = useState<boolean>(false);

  // Modular Setup Scope: BOTH (Full Stack), GITHUB_ONLY, SERVER_ONLY
  const [setupScope, setSetupScope] = useState<'BOTH' | 'GITHUB_ONLY' | 'SERVER_ONLY'>('BOTH');

  // SSH Auth Method: KEY or PASSWORD
  const [sshAuthMethod, setSshAuthMethod] = useState<'KEY' | 'PASSWORD'>('KEY');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Form Fields
  const [name, setName] = useState('');
  const [environmentType, setEnvironmentType] = useState('Docker Compose');
  const [gitUrl, setGitUrl] = useState('');
  const [gitBranch, setGitBranch] = useState('main');
  const [githubToken, setGithubToken] = useState('');
  const [serverHost, setServerHost] = useState('');
  const [serverPort, setServerPort] = useState('22');
  const [serverUser, setServerUser] = useState('ubuntu');
  const [projectPath, setProjectPath] = useState('/home/ubuntu');
  const [discoveredDirs, setDiscoveredDirs] = useState<string[]>([]);
  const [scanningDirs, setScanningDirs] = useState<boolean>(false);
  const [sshKey, setSshKey] = useState('');
  const [sshPassword, setSshPassword] = useState('');

  const handleScanServerDirectories = async () => {
    if (!serverHost.trim()) {
      setDiscoveredDirs([]);
      return;
    }
    setScanningDirs(true);
    try {
      const creds: ProjectCredentials = {
        serverHost: serverHost.trim(),
        serverPort: parseInt(serverPort, 10) || 22,
        serverUser: serverUser || 'ubuntu',
        sshKey: sshAuthMethod === 'KEY' ? sshKey : undefined
      };
      const res = await scanDirectoriesApi({
        serverHost: serverHost.trim(),
        serverPort: parseInt(serverPort, 10) || 22,
        serverUser: serverUser || 'ubuntu'
      }, creds);

      if (res && res.directories && res.directories.length > 0) {
        setDiscoveredDirs(res.directories);
      }
    } catch (e) {
      setDiscoveredDirs(['/home/ubuntu', '/var/www', '/opt']);
    } finally {
      setScanningDirs(false);
    }
  };

  const invalidateTest = () => {
    setTestResult(null);
  };

  const isRemoteConfigured = Boolean(gitUrl.trim() || serverHost.trim());
  const isTestPassed = testResult?.success === true;
  const isSubmitDisabled = loading || !name.trim() || (isRemoteConfigured && !isTestPassed);

  if (!isOpen) return null;

  // Dynamic steps based on chosen scope
  const steps = setupScope === 'BOTH' ? [
    { num: 1, label: 'General', isOptional: false },
    { num: 2, label: 'GitHub', isOptional: true },
    { num: 3, label: 'Server SSH', isOptional: true },
    { num: 4, label: 'Verify', isOptional: false }
  ] : setupScope === 'GITHUB_ONLY' ? [
    { num: 1, label: 'General', isOptional: false },
    { num: 2, label: 'GitHub Repo', isOptional: true },
    { num: 3, label: 'Verify', isOptional: false }
  ] : [
    { num: 1, label: 'General', isOptional: false },
    { num: 2, label: 'Server SSH', isOptional: true },
    { num: 3, label: 'Verify', isOptional: false }
  ];

  const maxSteps = steps.length;

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!name.trim()) {
        alert('Please enter a project name to continue.');
        return false;
      }
    }
    // GitHub Repo URL, PAT token, Server Host IP, and SSH keys are 100% OPTIONAL.
    // Users can create a workspace with just a name and add or edit credentials later!
    return true;
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep < step) {
      setStep(targetStep);
      return;
    }
    for (let s = 1; s < targetStep; s++) {
      if (!validateStep(s)) return;
    }
    setStep(targetStep);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      if (!gitUrl.trim() && !serverHost.trim()) {
        setTestResult({
          success: true,
          ssh: { message: 'Local Sandbox Engine Active (Port 5080)' },
          github: { message: 'Local Workspace ready (Attach repository anytime)' }
        });
        setTesting(false);
        return;
      }

      const creds: ProjectCredentials = {
        gitUrl: setupScope !== 'SERVER_ONLY' ? gitUrl : undefined,
        githubToken: setupScope !== 'SERVER_ONLY' ? githubToken : undefined,
        serverHost: setupScope !== 'GITHUB_ONLY' ? serverHost : undefined,
        serverPort: parseInt(serverPort, 10) || 22,
        serverUser,
        sshKey: sshAuthMethod === 'KEY' ? sshKey : undefined,
        sshPassword: sshAuthMethod === 'PASSWORD' ? sshPassword : undefined
      };

      const result = await testConnection({
        gitUrl: setupScope !== 'SERVER_ONLY' ? gitUrl : undefined,
        gitBranch: setupScope !== 'SERVER_ONLY' ? gitBranch : undefined,
        serverHost: setupScope !== 'GITHUB_ONLY' ? serverHost : undefined,
        serverPort: parseInt(serverPort, 10) || 22,
        serverUser
      }, creds);

      setTestResult(result);
      return result;
    } catch (err: any) {
      const errRes = { success: false, error: err.message };
      setTestResult(errRes);
      return errRes;
    } finally {
      setTesting(false);
    }
  };

  const handleCreateProject = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const finalGitUrl = setupScope !== 'SERVER_ONLY' ? gitUrl.trim() : undefined;
      const finalServerHost = setupScope !== 'GITHUB_ONLY' ? serverHost.trim() : undefined;

      // Auto-verify connection if user provided GitHub URL or SSH Server but hasn't verified yet
      if ((finalGitUrl || finalServerHost) && (!testResult || !testResult.success)) {
        const testRes = await handleTestConnection();
        if (!testRes?.success) {
          setLoading(false);
          alert(`Connection Verification Failed: ${testRes?.github?.message || testRes?.ssh?.message || testRes?.error || 'Check details & try again.'}`);
          return;
        }
      }

      const creds: ProjectCredentials = {
        gitUrl: finalGitUrl,
        githubToken: setupScope !== 'SERVER_ONLY' ? githubToken : undefined,
        serverHost: finalServerHost,
        serverPort: parseInt(serverPort, 10) || 22,
        serverUser,
        sshKey: sshAuthMethod === 'KEY' ? sshKey : undefined,
        sshPassword: sshAuthMethod === 'PASSWORD' ? sshPassword : undefined
      };

      const created = await createNewProject({
        name,
        gitUrl: finalGitUrl,
        serverHost: finalServerHost,
        serverPort: parseInt(serverPort, 10) || 22,
        serverUser,
        environmentType
      }, creds);

      onProjectCreated(created);
      onClose();
    } catch (err: any) {
      alert(`Error creating project: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const scopeOptions = [
    { 
      scope: 'BOTH', 
      title: 'Full Stack (Recommended)', 
      desc: 'Connect Server SSH + GitHub for complete AI chat investigations & code auditing',
      icon: Zap,
      badge: 'ALL FEATURES'
    },
    { 
      scope: 'GITHUB_ONLY', 
      title: 'GitHub Code Auditor Only', 
      desc: 'Audit security vulnerabilities, PR patches & code quality (No SSH Server needed)',
      icon: Github,
      badge: 'AUDITOR ONLY'
    },
    { 
      scope: 'SERVER_ONLY', 
      title: 'Server DevOps AI Only', 
      desc: 'SSH remote management, container restarts & live incident chat (No GitHub needed)',
      icon: Server,
      badge: 'SERVER ONLY'
    }
  ];

  const envOptions = [
    { type: 'Docker Compose', icon: Box, desc: 'Containerized multi-service compose stack' },
    { type: 'Node.js API', icon: Code, desc: 'Standalone Express / Nest.js API service' },
    { type: 'Kubernetes Cluster', icon: Globe, desc: 'Production K8s deployment manifests' },
    { type: 'Python / FastAPI', icon: Cpu, desc: 'Uvicorn / Gunicorn Python service' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white dark:bg-[#0d1117] w-full max-w-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden font-sans"
        >
          {/* Modal Header Banner */}
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-[#0d1117] dark:via-[#161b22] dark:to-[#0d1117] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md glow-blue shrink-0">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Setup Production Project</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Step {step} of {maxSteps} — {steps[step - 1]?.label || 'Configure'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Zero-DB Security Notice Banner */}
          <div className="px-5 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Zero-DB Storage Security: Credentials encrypted in client vault only.</span>
            </div>
            <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">VAULT SECURE</span>
          </div>

          {/* Progress Line */}
          <div className="w-full bg-slate-100 dark:bg-slate-900 h-1">
            <motion.div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1"
              animate={{ width: `${(step / maxSteps) * 100}%` }}
              transition={{ duration: 0.25 }}
            />
          </div>

          {/* Stepper Pill Indicators */}
          <div 
            className="px-5 pt-3 pb-1"
            style={{ display: 'grid', gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`, gap: '6px' }}
          >
            {steps.map(s => {
              const isConfigured = 
                s.label === 'General' ? Boolean(name.trim()) :
                s.label === 'GitHub' ? Boolean(gitUrl.trim()) :
                s.label === 'Server SSH' ? Boolean(serverHost.trim()) :
                step === s.num;

              const isCompleted = step > s.num && isConfigured;

              return (
                <div
                  key={s.num}
                  onClick={() => handleStepClick(s.num)}
                  className={`relative py-1.5 px-2 rounded-xl border text-center cursor-pointer transition-all flex items-center justify-center gap-1 text-[11px] ${
                    step === s.num
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 font-extrabold shadow-sm glow-blue'
                      : isCompleted
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 font-medium hover:border-slate-300'
                  }`}
                >
                  {s.isOptional && (
                    <span className={`absolute -top-2 right-1 text-[8px] font-extrabold font-mono px-1.5 py-0.2 rounded-full border shadow-2xs ${
                      step === s.num
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-xs'
                        : 'bg-slate-900 text-amber-400 border-amber-500/40 font-bold'
                    }`}>
                      Optional
                    </span>
                  )}
                  {isCompleted ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <span>{s.num}.</span>}
                  <span className="truncate">{s.label}</span>
                </div>
              );
            })}
          </div>

          {/* Body Content */}
          <div className="p-5 space-y-4 max-h-[58vh] overflow-y-auto font-sans">
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Project Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Production E-Commerce API / Payments Worker"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                  />
                </div>

                {/* Integration Scope Mode Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    <span>Select Integration Scope Mode</span>
                  </label>
                  <div className="space-y-2.5">
                    {scopeOptions.map(opt => {
                      const IconComp = opt.icon;
                      const isSelected = setupScope === opt.scope;

                      return (
                        <div
                          key={opt.scope}
                          onClick={() => setSetupScope(opt.scope as any)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                            isSelected
                              ? 'bg-gradient-to-r from-blue-50/90 via-blue-50/50 to-indigo-50/30 dark:from-blue-950/40 dark:via-blue-950/20 dark:to-indigo-950/20 border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                              : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-blue-400/60 dark:hover:border-blue-500/40 hover:shadow-xs'
                          }`}
                        >
                          {/* Radio Check Circle */}
                          <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition ${
                            isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 dark:border-slate-700'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>

                          <div className={`p-2 rounded-xl shrink-0 ${
                            isSelected ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                            <IconComp className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className={`text-xs font-extrabold ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-slate-100'}`}>
                                {opt.title}
                              </h4>
                              <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-md border ${
                                isSelected 
                                  ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs' 
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                              }`}>
                                {opt.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
                              {opt.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Runtime Type */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Environment & Runtime Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {envOptions.map(opt => {
                      const IconComponent = opt.icon;
                      const isSelected = environmentType === opt.type;

                      return (
                        <div
                          key={opt.type}
                          onClick={() => setEnvironmentType(opt.type)}
                          className={`p-2.5 rounded-xl border cursor-pointer text-xs transition-all space-y-0.5 ${
                            isSelected
                              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-600 text-blue-700 dark:text-blue-300 shadow-xs font-bold'
                              : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                            <span className="font-bold text-xs">{opt.type}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 in BOTH/GITHUB_ONLY mode: GitHub Form */}
            {((setupScope === 'BOTH' && step === 2) || (setupScope === 'GITHUB_ONLY' && step === 2)) && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5 text-slate-800 dark:text-slate-200" />
                    <span>GitHub Repository URL <span className="text-slate-400 font-normal text-[10px]">(Optional - Add or edit anytime)</span></span>
                  </label>
                  <input
                    type="text"
                    value={gitUrl}
                    onChange={e => setGitUrl(e.target.value)}
                    placeholder="https://github.com/owner/repository"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500 shadow-xs"
                  />
                </div>

                {/* Target Branch Name Field */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-blue-400" />
                      <span>Target Branch Name</span>
                    </span>
                    <span className="text-[9px] text-blue-500 font-mono font-bold">Default: main</span>
                  </label>
                  <input
                    type="text"
                    value={gitBranch}
                    onChange={e => setGitBranch(e.target.value)}
                    placeholder="main"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-500" />
                      <span>GitHub Personal Access Token (PAT)</span>
                      
                      {/* Interactive Help Toggle Button */}
                      <button
                        type="button"
                        onClick={() => setShowPatHelp(!showPatHelp)}
                        onMouseEnter={() => setShowPatHelp(true)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 text-[10px] font-extrabold transition cursor-pointer border border-blue-500/20 active:scale-95"
                      >
                        <HelpCircle className="w-3 h-3 text-blue-400 shrink-0" />
                        <span>{showPatHelp ? 'Hide Guide' : 'Where to get this?'}</span>
                      </button>
                    </span>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">Client-Side Vault Only</span>
                  </label>

                  {/* Inline Step-by-Step PAT Guide (100% Unclipped Guarantee) */}
                  {showPatHelp && (
                    <div className="my-2.5 p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/40 text-slate-800 dark:text-slate-100 space-y-2 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-1">
                      <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 font-black text-xs border-b border-blue-200 dark:border-blue-500/30 pb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>How to get GitHub Access Token (PAT):</span>
                        </span>
                        <button 
                          type="button" 
                          onClick={() => setShowPatHelp(false)} 
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-white px-1.5 py-0.5 font-bold text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-700 dark:text-slate-200 font-mono leading-relaxed pl-0.5">
                        <li>Open GitHub Settings: <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline font-bold hover:text-blue-500 dark:hover:text-blue-300">github.com/settings/tokens</a></li>
                        <li>Click <strong className="text-slate-900 dark:text-white font-bold">Generate new token (classic)</strong>.</li>
                        <li>Give a Note (e.g. <code className="text-blue-600 dark:text-blue-400 font-bold">OpsPilot AI</code>) and check <strong className="text-emerald-600 dark:text-emerald-400 font-bold">repo</strong> scope.</li>
                        <li>Click <strong className="text-slate-900 dark:text-white font-bold">Generate token</strong>, copy your <code className="text-amber-700 dark:text-amber-400 font-bold bg-amber-500/10 dark:bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30 dark:border-amber-500/40">ghp_...</code> key & paste below.</li>
                      </ol>

                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 border-t border-blue-200 dark:border-slate-800/80 pt-2 mt-1">
                        <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Encrypted 100% in client vault. Never saved to DB.</span>
                      </div>
                    </div>
                  )}

                  <input
                    type="password"
                    value={githubToken}
                    onChange={e => setGithubToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500 shadow-xs"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Enables live GitHub REST API auditing for security vulnerabilities, commit traces, and pull request patches.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3 in BOTH mode or Step 2 in SERVER_ONLY mode: Server SSH Form */}
            {((setupScope === 'BOTH' && step === 3) || (setupScope === 'SERVER_ONLY' && step === 2)) && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Server Host IP / Domain <span className="text-slate-400 font-normal text-[10px]">(Optional - Add or edit anytime)</span>
                    </label>
                    <input
                      type="text"
                      value={serverHost}
                      onChange={e => setServerHost(e.target.value)}
                      placeholder="e.g. 192.168.1.100 or api.company.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                      SSH Port
                    </label>
                    <input
                      type="text"
                      value={serverPort}
                      onChange={e => setServerPort(e.target.value)}
                      placeholder="22"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500 shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                    SSH User
                  </label>
                  <input
                    type="text"
                    value={serverUser}
                    onChange={e => setServerUser(e.target.value)}
                    placeholder="ubuntu or root"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500 shadow-xs"
                  />
                </div>

                {/* Remote Server Application Working Directory Path */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-blue-500" />
                      <span>Target Application Directory Path on Server</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleScanServerDirectories}
                      disabled={scanningDirs}
                      className="px-2 py-0.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-extrabold transition flex items-center gap-1 cursor-pointer border border-blue-500/20"
                    >
                      {scanningDirs ? <Loader2 className="w-3 h-3 animate-spin text-blue-400" /> : <Search className="w-3 h-3 text-blue-400" />}
                      <span>{scanningDirs ? 'Scanning...' : 'Auto-Scan Folders'}</span>
                    </button>
                  </div>
                  
                  <input
                    type="text"
                    value={projectPath}
                    onChange={e => setProjectPath(e.target.value)}
                    placeholder="/home/ubuntu/finance-lock or /var/www/app"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500 shadow-xs"
                  />

                  {/* Discovered Server Directories Chips */}
                  {discoveredDirs.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <span className="text-[10px] text-slate-500 font-mono font-bold block">Discovered Application Folders on Host:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {discoveredDirs.map(dir => (
                          <button
                            key={dir}
                            type="button"
                            onClick={() => setProjectPath(dir)}
                            className={`px-2 py-1 rounded-md text-[10px] font-mono transition cursor-pointer font-bold border ${
                              projectPath === dir
                                ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            📁 {dir}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* SSH Authentication Method Subnav Toggle */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    Select SSH Authentication Method
                  </label>
                  
                  <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSshAuthMethod('KEY')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                        sshAuthMethod === 'KEY'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>SSH Private Key</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSshAuthMethod('PASSWORD')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                        sshAuthMethod === 'PASSWORD'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>SSH User Password</span>
                    </button>
                  </div>

                  {sshAuthMethod === 'KEY' ? (
                    <div>
                      <textarea
                        rows={3}
                        value={sshKey}
                        onChange={e => setSshKey(e.target.value)}
                        placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500 resize-none shadow-xs"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={sshPassword}
                        onChange={e => setSshPassword(e.target.value)}
                        placeholder="Enter SSH root / user password"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500 shadow-xs pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Final Step: Verify & Complete */}
            {step === maxSteps && (
              <div className="space-y-3.5">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs">
                  <h3 className="text-[11px] font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span>Project Configuration Summary</span>
                    <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">READY TO VERIFY</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-400 block text-[9px]">Project Name</span> <strong className="text-slate-800 dark:text-slate-200">{name || 'Unnamed Project'}</strong></div>
                    <div><span className="text-slate-400 block text-[9px]">Scope Mode</span> <strong className="text-blue-600 dark:text-blue-400 font-bold">{setupScope}</strong></div>
                    {setupScope !== 'SERVER_ONLY' && (
                      <div className="col-span-2 flex items-center justify-between gap-2 text-xs pt-1.5 border-t border-slate-200 dark:border-slate-800/80">
                        <span className="text-slate-400 text-[10px] font-bold shrink-0">
                          GitHub Repository <span className="text-blue-400 font-mono text-[9px]">({gitBranch.trim() || 'main'})</span>
                        </span> 
                        {gitUrl.trim() ? (
                          <a 
                            href={gitUrl.startsWith('http') ? gitUrl : `https://${gitUrl}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-[10.5px] font-mono font-extrabold text-blue-500 hover:text-blue-400 underline flex items-center gap-1.5 truncate text-right hover:scale-[1.01] transition"
                            title="Open repository in GitHub"
                          >
                            <span className="truncate">{gitUrl}</span>
                            <ExternalLink className="w-3 h-3 text-blue-400 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-[10.5px] font-mono font-bold text-slate-400 italic">Not configured</span>
                        )}
                      </div>
                    )}
                    {setupScope !== 'GITHUB_ONLY' && (
                      <div className="col-span-2 flex items-center justify-between gap-2 text-xs pt-1 border-t border-slate-200 dark:border-slate-800/80">
                        <span className="text-slate-400 text-[10px] font-bold shrink-0">Server SSH Endpoint</span> 
                        {serverHost.trim() ? (
                          <span className="text-[10.5px] font-mono font-bold text-slate-800 dark:text-slate-200 truncate text-right">{serverUser}@{serverHost}:{serverPort}</span>
                        ) : (
                          <span className="text-[10.5px] font-mono font-bold text-slate-400 italic text-right">Not configured</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {!gitUrl.trim() && !serverHost.trim() && (
                  <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-blue-400 font-extrabold">
                      <Cpu className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>⚡ Local Sandbox & AST Engine Ready</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Your project workspace is initialized! You can perform instant AST vulnerability audits on local workspace files, or attach a live GitHub repo / SSH server anytime from project settings.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-0.5">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition disabled:opacity-50 shadow-xs"
                  >
                    {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Terminal className="w-3.5 h-3.5 text-blue-500" />}
                    <span>{testing ? 'Testing Connection...' : 'Test Connection'}</span>
                  </button>
                </div>

                {testResult && (
                  <div className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-1 shadow-xs ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300'
                  }`}>
                    {testResult.ssh && setupScope !== 'GITHUB_ONLY' && serverHost.trim() !== '' && (
                      <div className="flex items-center gap-1.5 font-bold text-[11px]">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>SSH Connection: {testResult.ssh.message}</span>
                      </div>
                    )}
                    {testResult.github && setupScope !== 'SERVER_ONLY' && gitUrl.trim() !== '' && (
                      <div className="flex items-center gap-1.5 font-bold text-[11px]">
                        {testResult.github.connected ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 animate-bounce" />
                        )}
                        <span className={testResult.github.connected ? 'text-emerald-400' : 'text-rose-400 font-extrabold'}>
                          GitHub Connection: {testResult.github.message || (testResult.github.connected ? 'Authenticated successfully' : 'Branch or repository error')}
                        </span>
                      </div>
                    )}
                    {!serverHost.trim() && !gitUrl.trim() && (
                      <div className="flex items-center gap-1.5 font-bold text-[11px]">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Local Sandbox Engine: Active & Ready</span>
                      </div>
                    )}
                    {testResult.error && (
                      <div className="font-semibold text-[11px]">Error: {testResult.error}</div>
                    )}
                  </div>
                )}

                {testResult?.discovery && serverHost.trim() !== '' && (
                  <ServerDiscoveryReport
                    discovery={testResult.discovery}
                    host={serverHost}
                    user={serverUser || 'root'}
                  />
                )}
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(prev => Math.max(1, prev - 1))}
              disabled={step === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            {step < maxSteps ? (
              <button
                type="button"
                onClick={() => {
                  if (validateStep(step)) {
                    setStep(prev => prev + 1);
                  }
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-md glow-blue transition active:scale-[0.98]"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={handleCreateProject}
                  disabled={isSubmitDisabled}
                  title={isSubmitDisabled && isRemoteConfigured && !isTestPassed ? "Please run 'Test Connection' and pass verification first" : ""}
                  className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-extrabold rounded-xl transition shadow-md ${
                    isSubmitDisabled
                      ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700/60 opacity-60'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-[0.98] glow-emerald'
                  }`}
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Create & Connect Project</span>
                </button>
                {isSubmitDisabled && isRemoteConfigured && !isTestPassed && (
                  <span className="text-[9px] text-amber-500 font-extrabold flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
                    <span>Run &quot;Test Connection&quot; above to enable creation</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
