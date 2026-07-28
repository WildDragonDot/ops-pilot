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
    <div className="h-screen flex font-sans antialiased overflow-hidden">
      
      {/* Left Collapsible Navigation Sidebar */}
      <Sidebar incidents={incidents} scanScore={scan?.overallScore} />

      {/* Main Right Content Section — full height, scrollable */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Top Header Bar — sticky at top */}
        <Header
          project={project}
          onResetEnv={onResetEnv}
          onScanRepo={onScanRepo}
          isScanning={isScanning}
        />

        {/* Page Content — scrollable area */}
        <main className="flex-1 overflow-y-auto w-full flex flex-col">
          <div className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8">
            <Outlet />
          </div>
          
          {/* Footer inside scroll area */}
          <footer className="border-t theme-border card-bg-subtle py-4 px-8 text-xs text-subtitle flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
            <span>OpsPilot AI — Enterprise Production Commander & GitHub Auditor</span>
            <span className="font-mono">Cluster Status: Healthy • Port 5080 API</span>
          </footer>
        </main>

      </div>

    </div>
  );
};
