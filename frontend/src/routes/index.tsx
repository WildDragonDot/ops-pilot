import React, { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Project, Scan, Incident } from '../types';
import { 
  fetchProject, 
  fetchProjects,
  fetchRepositoryScan, 
  triggerRepositoryScan, 
  fetchIncidents, 
  injectFailure, 
  resetEnvironment 
} from '../services/api';
import { logger } from '../services/logger';

const Dashboard = lazy(() => import('../pages/Dashboard').then(m => ({ default: m.Dashboard })));
const ProjectSelectionPage = lazy(() => import('../pages/ProjectSelectionPage').then(m => ({ default: m.ProjectSelectionPage })));
const RepoAuditor = lazy(() => import('../pages/RepoAuditor').then(m => ({ default: m.RepoAuditor })));
const CommandCenter = lazy(() => import('../pages/CommandCenter').then(m => ({ default: m.CommandCenter })));
const ApprovalsPage = lazy(() => import('../pages/ApprovalsPage').then(m => ({ default: m.ApprovalsPage })));
const RunbooksPage = lazy(() => import('../pages/RunbooksPage').then(m => ({ default: m.RunbooksPage })));
const AuditLogs = lazy(() => import('../pages/AuditLogs').then(m => ({ default: m.AuditLogs })));
const IncidentReports = lazy(() => import('../pages/IncidentReports').then(m => ({ default: m.IncidentReports })));
const SandboxControl = lazy(() => import('../pages/SandboxControl').then(m => ({ default: m.SandboxControl })));
const SettingsPage = lazy(() => import('../pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const LoginPage = lazy(() => import('../pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ProjectSetupModal = lazy(() => import('../components/ProjectSetupModal').then(m => ({ default: m.ProjectSetupModal })));

function RouteFallback() {
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [progress, setProgress] = useState<number>(18);

  const steps = [
    'Establishing Autonomous AI Agent Core...',
    'Syncing Infrastructure Security Matrix...',
    'Initializing D-OpsPilot Real-Time Engine...'
  ];

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % steps.length);
    }, 1200);

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 96) return 18;
        return Math.min(96, prev + Math.floor(Math.random() * 12) + 6);
      });
    }, 280);

    return () => {
      clearInterval(stepTimer);
      clearInterval(progressTimer);
    };
  }, []);

  return (
    <div className="min-h-[75vh] w-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-blue-600/20 via-indigo-500/15 to-purple-600/20 blur-3xl animate-pulse pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center space-y-6 max-w-sm w-full text-center">
        {/* Orbital Concentric Rings Logo */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-blue-500/30 dark:border-blue-400/20 animate-spin" style={{ animationDuration: '12s' }} />
          <div className="absolute inset-2 rounded-full border border-indigo-500/40 dark:border-indigo-400/30 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '8s' }} />
          <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping opacity-30" />
          
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-2xl glow-blue relative z-10 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Cpu className="w-7 h-7 text-blue-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Brand Banner */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 dark:bg-slate-950/90 border border-slate-700/80 dark:border-slate-800 shadow-xl backdrop-blur-md">
            <span className="font-extrabold text-white font-display tracking-wider text-sm bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              D-OpsPilot AI
            </span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[9px] font-extrabold uppercase border border-emerald-500/30">
              AGENT READY
            </span>
          </div>
        </div>

        {/* Dynamic Rotating Progress Text & Live Percentage */}
        <div className="space-y-2.5 w-full">
          <div className="flex items-center justify-between font-mono text-xs text-slate-600 dark:text-slate-300 font-medium px-1">
            <div className="flex items-center gap-2 truncate max-w-[240px]">
              <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="truncate">{steps[loadingStep]}</span>
            </div>
            <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0 font-mono">{progress}%</span>
          </div>

          {/* Active Running Glowing Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-300 dark:border-slate-800/80 shadow-inner p-0.5 relative">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-full transition-all duration-300 ease-out shadow-md glow-blue"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppRoutes() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [scan, setScan] = useState<Scan | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const savedId = localStorage.getItem('opspilot_selected_project_id');
      let currentProjectId = project?.id || savedId || undefined;

      const allProjects = await fetchProjects();
      setProjects(allProjects);
      
      const found = allProjects.find(p => p.id === (project?.id || savedId)) || allProjects[0];
      if (found) {
        setProject(prev => (!prev || prev.id !== found.id) ? found : prev);
        currentProjectId = found.id;
      } else if (savedId) {
        localStorage.removeItem('opspilot_selected_project_id');
        currentProjectId = undefined;
        setProject(null);
      }

      const [scanResult, incidentsResult] = await Promise.allSettled([
        fetchRepositoryScan(currentProjectId),
        fetchIncidents(currentProjectId)
      ]);

      if (scanResult.status === 'fulfilled') {
        setScan(scanResult.value);
      } else {
        logger.warn('Repository scan data failed to load', scanResult.reason);
        setScan(null);
      }

      if (incidentsResult.status === 'fulfilled') {
        setIncidents(incidentsResult.value);
      } else {
        logger.warn('Incident data failed to load', incidentsResult.reason);
        if (!currentProjectId) {
          setIncidents([]);
        }
      }
    } catch (err) {
      logger.error('Error loading API data', err);
      setProjects([]);
      setProject(null);
      setScan(null);
      setIncidents([]);
    } finally {
      setIsLoadingProjects(false);
    }
  }, [user, project?.id]);

  useEffect(() => {
    if (user) {
      loadData();
      // Background sync every 30s (SSE stream handles live real-time updates)
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          loadData();
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, project?.id, loadData]);

  const handleSelectProject = (selectedP: Project) => {
    setProject(selectedP);
    setIncidents([]); // Clear stale incidents immediately before re-fetch
    localStorage.setItem('opspilot_selected_project_id', selectedP.id);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-app text-title font-sans">
        <div className="w-full max-w-md space-y-6 text-center animate-fadeIn">
          <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl text-white shadow-xl glow-blue inline-flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-title font-mono tracking-tight">Initializing D-OpsPilot AI...</h3>
            <p className="text-xs text-subtitle font-mono">Verifying authentication vault & loading workspace session</p>
          </div>
          <div className="space-y-3 pt-2">
            <div className="skeleton-box h-4 w-full rounded-lg" />
            <div className="skeleton-box h-4 w-3/4 mx-auto rounded-lg" />
            <div className="skeleton-box h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage onSwitchToRegister={() => navigate('/register')} />} />
          <Route path="/register" element={<RegisterPage onSwitchToLogin={() => navigate('/login')} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    );
  }

  const handleScanRepo = async () => {
    try {
      setIsScanning(true);
      const newScan = await triggerRepositoryScan(project?.id);
      setScan(newScan);
      setTimeout(async () => {
        const updated = await fetchRepositoryScan(project?.id);
        setScan(updated);
        setIsScanning(false);
      }, 3000);
    } catch (err) {
      logger.error('Repository scan failed', err);
      setIsScanning(false);
    }
  };

  const handleInjectFailure = async (scenarioKey: string) => {
    try {
      await injectFailure(scenarioKey, project?.id);
      await loadData();
    } catch (err) {
      logger.error('Failure injection failed', err);
    }
  };

  const handleResetEnv = async () => {
    try {
      await resetEnvironment(project?.id);
      await loadData();
    } catch (err) {
      logger.error('Environment reset failed', err);
    }
  };

  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Standalone Landing Route (NO Sidebar, NO Top Navbar) */}
          <Route
            path="/projects"
            element={
              <ProjectSelectionPage
                projects={projects}
                activeProject={project}
                isLoading={isLoadingProjects}
                onSelectProject={(selectedP) => {
                  handleSelectProject(selectedP);
                  navigate('/dashboard');
                }}
                onOpenSetupModal={() => setIsSetupModalOpen(true)}
                onProjectDeleted={(deletedId) => setProjects(prev => prev.filter(p => p.id !== deletedId))}
              />
            }
          />

        {/* Workspace Layout Routes (WITH Sidebar and Top Header) */}
        <Route
          element={
            <DashboardLayout
              project={project}
              projects={projects}
              scan={scan}
              incidents={incidents}
              onSelectProject={handleSelectProject}
              onOpenSetupModal={() => setIsSetupModalOpen(true)}
              onResetEnv={handleResetEnv}
              onScanRepo={handleScanRepo}
              isScanning={isScanning}
            />
          }
        >
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route
            path="/dashboard"
            element={
              <Dashboard
                project={project}
                scan={scan}
                incidents={incidents}
                onNavigateTab={(tabKey) => {
                  if (tabKey === 'auditor') navigate('/auditor');
                  else if (tabKey === 'command') navigate('/command');
                  else if (tabKey === 'approvals') navigate('/approvals');
                  else if (tabKey === 'reports') navigate('/reports');
                  else if (tabKey === 'sandbox') navigate('/sandbox');
                }}
                onInjectFailure={handleInjectFailure}
              />
            }
          />
          <Route
            path="/auditor"
            element={
              project?.gitUrl?.trim() ? (
                <RepoAuditor
                  scan={scan}
                  project={project}
                  onScanRepo={handleScanRepo}
                  isScanning={isScanning}
                  onPatchApplied={(updatedScan) => setScan(updatedScan)}
                  onNavigateTab={(tab) => navigate(tab === 'overview' ? '/' : `/${tab}`)}
                />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/command"
            element={
              <CommandCenter
                incidents={incidents}
                project={project}
                onRefreshIncidents={loadData}
              />
            }
          />
          <Route
            path="/approvals"
            element={
              <ApprovalsPage
                incidents={incidents}
                project={project}
                onRefreshIncidents={loadData}
              />
            }
          />
          <Route path="/runbooks" element={<RunbooksPage project={project} />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route
            path="/reports"
            element={
              <IncidentReports
                incidents={incidents}
              />
            }
          />
          <Route
            path="/sandbox"
            element={
              <SandboxControl
                project={project}
                onInjectFailure={handleInjectFailure}
                onResetEnv={handleResetEnv}
                onNavigateTab={(tabKey) => {
                  if (tabKey === 'command') navigate('/command');
                }}
              />
            }
          />
          <Route path="/settings" element={<SettingsPage onOpenSetupModal={() => setIsSetupModalOpen(true)} />} />
          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Route>
        </Routes>
      </Suspense>

      {/* 4-Step Add Project Wizard */}
      {isSetupModalOpen && (
        <Suspense fallback={null}>
          <ProjectSetupModal
            isOpen={isSetupModalOpen}
            onClose={() => setIsSetupModalOpen(false)}
            onProjectCreated={(newProject) => {
              setProjects(prev => [newProject, ...prev]);
              handleSelectProject(newProject);
              navigate('/dashboard');
            }}
          />
        </Suspense>
      )}
    </>
  );
}
