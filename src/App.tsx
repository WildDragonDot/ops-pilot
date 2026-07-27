import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { RepoAuditor } from './pages/RepoAuditor';
import { CommandCenter } from './pages/CommandCenter';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { IncidentReports } from './pages/IncidentReports';
import { SandboxControl } from './pages/SandboxControl';
import { Project, Scan, Incident } from './types';
import { 
  fetchProject, 
  fetchRepositoryScan, 
  triggerRepositoryScan, 
  fetchIncidents, 
  injectFailure, 
  resetEnvironment 
} from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [project, setProject] = useState<Project | null>(null);
  const [scan, setScan] = useState<Scan | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Load initial application data
  const loadData = async () => {
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
      console.error('Error loading initial data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        project={project}
        onResetEnv={handleResetEnv}
        onScanRepo={handleScanRepo}
        isScanning={isScanning}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            project={project}
            scan={scan}
            incidents={incidents}
            onNavigateTab={setActiveTab}
            onInjectFailure={handleInjectFailure}
          />
        )}

        {activeTab === 'auditor' && (
          <RepoAuditor
            scan={scan}
            onScanRepo={handleScanRepo}
            isScanning={isScanning}
          />
        )}

        {activeTab === 'command' && (
          <CommandCenter
            incidents={incidents}
            onRefreshIncidents={loadData}
          />
        )}

        {activeTab === 'approvals' && (
          <ApprovalsPage
            incidents={incidents}
            onRefreshIncidents={loadData}
          />
        )}

        {activeTab === 'reports' && (
          <IncidentReports
            incidents={incidents}
          />
        )}

        {activeTab === 'sandbox' && (
          <SandboxControl
            project={project}
            onInjectFailure={handleInjectFailure}
            onResetEnv={handleResetEnv}
            onNavigateTab={setActiveTab}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090d16]/90 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>OpsPilot AI — Senior Production Incident Commander & GitHub Auditor</span>
          <span className="font-mono text-slate-400">Environment: Isolated Docker Sandbox</span>
        </div>
      </footer>

    </div>
  );
}
