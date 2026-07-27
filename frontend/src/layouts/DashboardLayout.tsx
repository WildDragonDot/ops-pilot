import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { Project, Scan, Incident } from '../types';

interface DashboardLayoutProps {
  project: Project | null;
  scan: Scan | null;
  incidents: Incident[];
  onResetEnv: () => void;
  onScanRepo: () => void;
  isScanning: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  project,
  scan,
  incidents,
  onResetEnv,
  onScanRepo,
  isScanning
}) => {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex font-sans antialiased">
      
      {/* Left Collapsible Navigation Sidebar */}
      <Sidebar incidents={incidents} scanScore={scan?.overallScore} />

      {/* Main Right Content Section */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <Header
          project={project}
          onResetEnv={onResetEnv}
          onScanRepo={onScanRepo}
          isScanning={isScanning}
        />

        {/* Page Content Outlet */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 bg-[#070a12] py-4 px-8 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>OpsPilot AI — Enterprise Production Commander & GitHub Auditor</span>
          <span className="font-mono text-slate-400">Cluster Status: Healthy • Port 5080 API</span>
        </footer>

      </div>

    </div>
  );
};
