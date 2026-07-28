import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Dashboard } from '../pages/Dashboard';
import { RepoAuditor } from '../pages/RepoAuditor';
import { CommandCenter } from '../pages/CommandCenter';
import { ApprovalsPage } from '../pages/ApprovalsPage';
import { IncidentReports } from '../pages/IncidentReports';
import { SandboxControl } from '../pages/SandboxControl';
import { SettingsPage } from '../pages/SettingsPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { Project, Scan, Incident } from '../types';
import { 
  fetchProject, 
  fetchRepositoryScan, 
  triggerRepositoryScan, 
  fetchIncidents, 
  injectFailure, 
  resetEnvironment 
} from '../services/api';

export function AppRoutes() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [scan, setScan] = useState<Scan | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const loadData = async () => {
    if (!user) return;
    try {
      const [projData, scanData, incData] = await Promise.all([
        fetchProject(),
        fetchRepositoryScan(),
        fetchIncidents()
      ]);
      setProject(projData);
      setScan(scanData);
      setIncidents(incData);
    } catch (err) {
      console.error('Error loading API data:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
      const interval = setInterval(loadData, 3000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-subtitle text-xs font-mono">
        Initializing OpsPilot AI Workspace Session...
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
      const newScan = await triggerRepositoryScan();
      setScan(newScan);
      setTimeout(async () => {
        const updated = await fetchRepositoryScan();
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
      await injectFailure(scenarioKey);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetEnv = async () => {
    try {
      await resetEnvironment();
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Routes>
      <Route
        element={
          <DashboardLayout
            project={project}
            scan={scan}
            incidents={incidents}
            onResetEnv={handleResetEnv}
            onScanRepo={handleScanRepo}
            isScanning={isScanning}
          />
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
            <RepoAuditor
              scan={scan}
              onScanRepo={handleScanRepo}
              isScanning={isScanning}
            />
          }
        />
        <Route
          path="/command"
          element={
            <CommandCenter
              incidents={incidents}
              onRefreshIncidents={loadData}
            />
          }
        />
        <Route
          path="/approvals"
          element={
            <ApprovalsPage
              incidents={incidents}
              onRefreshIncidents={loadData}
            />
          }
        />
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
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
