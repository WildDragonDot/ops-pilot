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
  Info
} from 'lucide-react';
import { createNewProject, testConnection } from '../services/api';
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
  const [githubToken, setGithubToken] = useState('');
  const [serverHost, setServerHost] = useState('');
  const [serverPort, setServerPort] = useState('22');
  const [serverUser, setServerUser] = useState('root');
  const [sshKey, setSshKey] = useState('');
  const [sshPassword, setSshPassword] = useState('');

  if (!isOpen) return null;

  // Dynamic steps based on chosen scope
  const steps = setupScope === 'BOTH' ? [
    { num: 1, label: 'General' },
    { num: 2, label: 'GitHub' },
    { num: 3, label: 'Server SSH' },
    { num: 4, label: 'Verify' }
  ] : setupScope === 'GITHUB_ONLY' ? [
    { num: 1, label: 'General' },
    { num: 2, label: 'GitHub Repo' },
    { num: 3, label: 'Verify' }
  ] : [
    { num: 1, label: 'General' },
    { num: 2, label: 'Server SSH' },
    { num: 3, label: 'Verify' }
  ];

  const maxSteps = steps.length;

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!name.trim()) {
        alert('Please enter a project name to continue.');
        return false;
      }
    }
    
    if (setupScope === 'BOTH') {
      if (currentStep === 2) {
        if (!gitUrl.trim()) {
          alert('Please enter a GitHub Repository URL to continue.');
          return false;
        }
      }
      if (currentStep === 3) {
        if (!serverHost.trim()) {
          alert('Please enter a Server Host IP / Domain to continue.');
          return false;
        }
      }
    } else if (setupScope === 'GITHUB_ONLY') {
      if (currentStep === 2) {
        if (!gitUrl.trim()) {
          alert('Please enter a GitHub Repository URL to continue.');
          return false;
        }
      }
    } else if (setupScope === 'SERVER_ONLY') {
      if (currentStep === 2) {
        if (!serverHost.trim()) {
          alert('Please enter a Server Host IP / Domain to continue.');
          return false;
        }
      }
    }
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
        serverHost: setupScope !== 'GITHUB_ONLY' ? serverHost : undefined,
        serverPort: parseInt(serverPort, 10) || 22,
        serverUser
      }, creds);

      setTestResult(result);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
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
      desc: 'Connect Server SSH + GitHub for complete Incident Command & Code Auditing',
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
      title: 'Server DevOps Commander Only', 
      desc: 'SSH remote management, container restarts & live incident commander (No GitHub needed)',
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
            {steps.map(s => (
              <div
                key={s.num}
                onClick={() => handleStepClick(s.num)}
                className={`py-1.5 px-2 rounded-xl border text-center cursor-pointer transition-all flex items-center justify-center gap-1 text-[11px] ${
                  step === s.num
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 font-extrabold shadow-sm glow-blue'
                    : step > s.num
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-semibold'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 font-medium hover:border-slate-300'
                }`}
              >
                {step > s.num ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <span>{s.num}.</span>}
                <span className="truncate">{s.label}</span>
              </div>
            ))}
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
                    <span>GitHub Repository URL <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={gitUrl}
                    onChange={e => setGitUrl(e.target.value)}
                    placeholder="https://github.com/owner/repository"
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
                  </label>                  {/* Inline Step-by-Step PAT Guide Panel */}
                  {showPatHelp && (
                    <motion.div 
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="my-2.5 p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/40 border border-blue-500/30 text-slate-100 space-y-3 shadow-xl backdrop-blur-md"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="flex items-center gap-1.5 text-xs font-black text-blue-400">
                          <Info className="w-4 h-4 text-blue-400 shrink-0" />
                          <span>Generate Your GitHub Personal Access Token (PAT)</span>
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <a 
                            href="https://github.com/settings/tokens" 
                            target="_blank" 
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-mono font-extrabold transition shadow-xs flex items-center gap-1 active:scale-95"
                          >
                            <span>Open GitHub Tokens</span>
                            <ArrowRight className="w-3 h-3" />
                          </a>
                          <button 
                            type="button" 
                            onClick={() => setShowPatHelp(false)} 
                            className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded font-bold text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-xs font-mono text-slate-300">
                        <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                          <span className="w-5 h-5 rounded-lg bg-blue-600/20 text-blue-400 font-extrabold flex items-center justify-center text-[10px] border border-blue-500/30 shrink-0 mt-0.5">1</span>
                          <span className="text-[11px] leading-relaxed">
                            Open <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-blue-400 underline font-bold hover:text-blue-300">github.com/settings/tokens</a> in your browser.
                          </span>
                        </div>

                        <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                          <span className="w-5 h-5 rounded-lg bg-blue-600/20 text-blue-400 font-extrabold flex items-center justify-center text-[10px] border border-blue-500/30 shrink-0 mt-0.5">2</span>
                          <span className="text-[11px] leading-relaxed">
                            Click <strong className="text-white font-bold">Generate new token</strong> & select <strong className="text-slate-200">Generate new token (classic)</strong>.
                          </span>
                        </div>

                        <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                          <span className="w-5 h-5 rounded-lg bg-blue-600/20 text-blue-400 font-extrabold flex items-center justify-center text-[10px] border border-blue-500/30 shrink-0 mt-0.5">3</span>
                          <span className="text-[11px] leading-relaxed">
                            Add note (e.g. <code className="text-blue-400 font-bold">OpsPilot AI</code>) and check <strong className="text-emerald-400 font-bold">repo</strong> scope permission.
                          </span>
                        </div>

                        <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                          <span className="w-5 h-5 rounded-lg bg-blue-600/20 text-blue-400 font-extrabold flex items-center justify-center text-[10px] border border-blue-500/30 shrink-0 mt-0.5">4</span>
                          <span className="text-[11px] leading-relaxed">
                            Click <strong className="text-white font-bold">Generate token</strong>, copy key (<code className="text-amber-400 font-bold bg-amber-500/20 px-1 py-0.5 rounded border border-amber-500/40">ghp_...</code>) & paste below.
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5 border-t border-slate-800/80 pt-2">
                        <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Zero-DB Vault Guarantee: Token remains 100% encrypted in your local browser session.</span>
                      </div>
                    </motion.div>
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
                      Server Host IP / Domain <span className="text-rose-500">*</span>
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
                    placeholder="root or deploy"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500 shadow-xs"
                  />
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
                      <div><span className="text-slate-400 block text-[9px]">GitHub Repository</span> <strong className="text-slate-800 dark:text-slate-200 font-mono truncate block">{gitUrl || 'Not specified'}</strong></div>
                    )}
                    {setupScope !== 'GITHUB_ONLY' && (
                      <div><span className="text-slate-400 block text-[9px]">Server SSH Endpoint</span> <strong className="text-slate-800 dark:text-slate-200 font-mono">{serverHost ? `${serverUser}@${serverHost}:${serverPort}` : 'Local Sandbox'}</strong></div>
                    )}
                  </div>
                </div>

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
                    {testResult.ssh && setupScope !== 'GITHUB_ONLY' && (
                      <div className="flex items-center gap-1.5 font-bold text-[11px]">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>SSH Connection: {testResult.ssh.message}</span>
                      </div>
                    )}
                    {testResult.github && setupScope !== 'SERVER_ONLY' && (
                      <div className="flex items-center gap-1.5 font-bold text-[11px]">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>GitHub Connection: {testResult.github.message || 'Authenticated successfully'}</span>
                      </div>
                    )}
                    {testResult.error && (
                      <div className="font-semibold text-[11px]">Error: {testResult.error}</div>
                    )}
                  </div>
                )}

                {testResult?.discovery && (
                  <ServerDiscoveryReport
                    discovery={testResult.discovery}
                    host={serverHost || '34.224.80.31'}
                    user={serverUser || 'ubuntu'}
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
              <button
                type="button"
                onClick={handleCreateProject}
                disabled={loading || !name.trim()}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md transition disabled:opacity-50 active:scale-[0.98]"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Create & Connect Project</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
