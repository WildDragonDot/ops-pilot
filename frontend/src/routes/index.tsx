import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Dashboard } from '../pages/Dashboard';
import { ProjectSelectionPage } from '../pages/ProjectSelectionPage';
import { RepoAuditor } from '../pages/RepoAuditor';
import { CommandCenter } from '../pages/CommandCenter';
import { ApprovalsPage } from '../pages/ApprovalsPage';
import { IncidentReports } from '../pages/IncidentReports';
import { RunbooksPage } from '../pages/RunbooksPage';
import { AuditLogs } from '../pages/AuditLogs';
import { SandboxControl } from '../pages/SandboxControl';
import { SettingsPage } from '../pages/SettingsPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ProjectSetupModal } from '../components/ProjectSetupModal';
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

export function AppRoutes() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [scan, setScan] = useState<Scan | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);

  const loadData = async () => {
    if (!user) return;
    try {
      const savedId = localStorage.getItem('opspilot_selected_project_id');
      const currentProjectId = project?.id || savedId || undefined;

      const [allProjects, scanData, incData] = await Promise.all([
        fetchProjects(),
        fetchRepositoryScan(currentProjectId),
        fetchIncidents(currentProjectId)
      ]);
      setProjects(allProjects);
      
      const found = allProjects.find(p => p.id === (project?.id || savedId)) || allProjects[0];
      if (found) {
        setProject({ ...found });
        // Re-fetch incidents scoped to the resolved project if it differed
        if (found.id !== currentProjectId && allProjects.length > 0) {
          const scopedInc = await fetchIncidents(found.id);
          setIncidents(scopedInc);
        } else {
          setIncidents(incData);
        }
      } else {
        setIncidents(incData);
      }
      setScan(scanData);
    } catch (err) {
      console.error('Error loading API data:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          loadData();
        }
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [user, project?.id]);

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
      <Routes>
        <Route path="/login" element={<LoginPage onSwitchToRegister={() => navigate('/register')} />} />
        <Route path="/register" element={<RegisterPage onSwitchToLogin={() => navigate('/login')} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
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
      console.error(err);
      setIsScanning(false);
    }
  };

  const handleInjectFailure = async (scenarioKey: string) => {
    try {
      await injectFailure(scenarioKey, project?.id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetEnv = async () => {
    try {
      await resetEnvironment(project?.id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Routes>
        {/* Standalone Landing Route (NO Sidebar, NO Top Navbar) */}
        <Route
          path="/projects"
          element={
            <ProjectSelectionPage
              projects={projects}
              activeProject={project}
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

      {/* 4-Step Add Project Wizard */}
      <ProjectSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onProjectCreated={(newProject) => {
          setProjects(prev => [newProject, ...prev]);
          handleSelectProject(newProject);
          navigate('/dashboard');
        }}
      />
    </>
  );
}
