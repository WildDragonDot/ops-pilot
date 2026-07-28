import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Server, Github, Shield, Check, RefreshCw, ArrowRight, ArrowLeft, Key, Terminal, Cpu, Box, Code, Globe } from 'lucide-react';
import { createNewProject, testConnection } from '../services/api';
import { ProjectCredentials } from '../services/vault';
import { Project } from '../types';

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
  const [testResult, setTestResult] = useState<{ success?: boolean; ssh?: any; github?: any; error?: string } | null>(null);

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

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!name.trim()) {
        alert('Please enter a project name to continue.');
        return false;
      }
    }
    if (currentStep === 2) {
      if (!gitUrl.trim()) {
        alert('Please enter a GitHub Repository URL (e.g. https://github.com/owner/repository) to continue.');
        return false;
      }
      if (!gitUrl.toLowerCase().includes('github.com/')) {
        alert('GitHub Repository URL must be a valid GitHub URL (e.g. https://github.com/owner/repository).');
        return false;
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
        gitUrl,
        githubToken,
        serverHost,
        serverPort: parseInt(serverPort, 10) || 22,
        serverUser,
        sshKey,
        sshPassword
      };

      const result = await testConnection({
        gitUrl,
        serverHost,
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
      const creds: ProjectCredentials = {
        gitUrl,
        githubToken,
        serverHost,
        serverPort: parseInt(serverPort, 10) || 22,
        serverUser,
        sshKey,
        sshPassword
      };

      const created = await createNewProject({
        name,
        gitUrl,
        serverHost,
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
          className="bg-white dark:bg-[#0d1117] w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden font-sans"
        >
          {/* Modal Header Banner */}
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-[#0d1117] dark:via-[#161b22] dark:to-[#0d1117] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">Setup New Production Project</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Step {step} of 4 — Connect real SSH server & GitHub repository</p>
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
              <span>Zero-DB Storage Security: SSH Keys & PAT Tokens stay in browser vault only.</span>
            </div>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">VAULT SECURE</span>
          </div>

          {/* Progress Line */}
          <div className="w-full bg-slate-100 dark:bg-slate-900 h-1">
            <motion.div
              className="bg-blue-600 h-1"
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.25 }}
            />
          </div>

          {/* Stepper Pill Indicators */}
          <div className="px-5 pt-3 pb-1 grid grid-cols-4 gap-1.5">
            {[
              { num: 1, label: 'General' },
              { num: 2, label: 'GitHub' },
              { num: 3, label: 'Server SSH' },
              { num: 4, label: 'Verify' }
            ].map(s => (
              <div
                key={s.num}
                onClick={() => handleStepClick(s.num)}
                className={`py-1.5 px-2 rounded-lg border text-center cursor-pointer transition flex items-center justify-center gap-1 text-[11px] ${
                  step === s.num
                    ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                    : step > s.num
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-semibold'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 font-medium'
                }`}
              >
                {step > s.num ? <Check className="w-3 h-3" /> : <span>{s.num}.</span>}
                <span>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Body Content */}
          <div className="p-5 space-y-3.5 max-h-[58vh] overflow-y-auto font-sans">
            {step === 1 && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Project Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Production E-Commerce API / Payments Worker"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-blue-500 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Select Environment & Runtime Type
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {envOptions.map(opt => {
                      const IconComponent = opt.icon;
                      const isSelected = environmentType === opt.type;

                      return (
                        <div
                          key={opt.type}
                          onClick={() => setEnvironmentType(opt.type)}
                          className={`p-3 rounded-lg border cursor-pointer text-xs transition-all space-y-0.5 ${
                            isSelected
                              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-600 text-blue-700 dark:text-blue-300 shadow-xs font-bold'
                              : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                            <span className="font-bold text-xs">{opt.type}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal leading-tight">{opt.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5 text-slate-800 dark:text-slate-200" />
                    <span>GitHub Repository URL</span>
                  </label>
                  <input
                    type="text"
                    value={gitUrl}
                    onChange={e => setGitUrl(e.target.value)}
                    placeholder="https://github.com/owner/repository"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-500" />
                      <span>GitHub Personal Access Token (PAT)</span>
                    </span>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">Client-Side Vault Only</span>
                  </label>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={e => setGithubToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500 shadow-xs"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Enables live GitHub REST API auditing for security vulnerabilities, commit traces, and pull request patches.
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Server Host IP / Domain
                    </label>
                    <input
                      type="text"
                      value={serverHost}
                      onChange={e => setServerHost(e.target.value)}
                      placeholder="e.g. 192.168.1.100 or api.company.com"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500 shadow-xs"
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
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500 shadow-xs"
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
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center justify-between">
                    <span>SSH Private Key (Optional)</span>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">Zero-DB Storage</span>
                  </label>
                  <textarea
                    rows={3}
                    value={sshKey}
                    onChange={e => setSshKey(e.target.value)}
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500 resize-none shadow-xs"
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs">
                  <h3 className="text-[11px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span>Project Configuration Summary</span>
                    <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">READY TO VERIFY</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-400 block text-[9px]">Project Name</span> <strong className="text-slate-800 dark:text-slate-200">{name || 'Unnamed Project'}</strong></div>
                    <div><span className="text-slate-400 block text-[9px]">Environment</span> <strong className="text-slate-800 dark:text-slate-200">{environmentType}</strong></div>
                    <div><span className="text-slate-400 block text-[9px]">GitHub Repository</span> <strong className="text-slate-800 dark:text-slate-200 font-mono truncate block">{gitUrl || 'Not specified'}</strong></div>
                    <div><span className="text-slate-400 block text-[9px]">Server SSH Endpoint</span> <strong className="text-slate-800 dark:text-slate-200 font-mono">{serverHost ? `${serverUser}@${serverHost}:${serverPort}` : 'Local Sandbox Engine'}</strong></div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition disabled:opacity-50 shadow-xs"
                  >
                    {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Terminal className="w-3.5 h-3.5 text-blue-500" />}
                    <span>{testing ? 'Testing Live Connection...' : 'Test Live Server & GitHub Connection'}</span>
                  </button>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-lg border text-xs leading-relaxed space-y-1 shadow-xs ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300'
                  }`}>
                    {testResult.ssh && (
                      <div className="flex items-center gap-1.5 font-bold text-[11px]">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>SSH Connection: {testResult.ssh.message}</span>
                      </div>
                    )}
                    {testResult.github && (
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
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(prev => Math.max(1, prev - 1))}
              disabled={step === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (validateStep(step)) {
                    setStep(prev => prev + 1);
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreateProject}
                disabled={loading || !name.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition disabled:opacity-50"
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
