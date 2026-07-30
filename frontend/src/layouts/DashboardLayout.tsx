import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal';
import { useTheme } from '../context/ThemeContext';
import { Project, Scan, Incident } from '../types';

interface DashboardLayoutProps {
  project: Project | null;
  projects?: Project[];
  scan: Scan | null;
  incidents: Incident[];
  onSelectProject?: (project: Project) => void;
  onOpenSetupModal?: () => void;
  onResetEnv: () => void;
  onScanRepo: () => void;
  isScanning: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  project,
  projects = [],
  scan,
  incidents,
  onSelectProject,
  onOpenSetupModal,
  onResetEnv,
  onScanRepo,
  isScanning
}) => {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState<boolean>(false);

  const isLocalPath = (p?: string | null) => !p || p.startsWith('/Users/') || p.includes('Desktop') || p.startsWith('C:');
  const getCleanTargetPath = (p?: string | null) => {
    if (isLocalPath(p)) return '/home/ubuntu/finance-lock';
    return p as string;
  };

  const [selectedTargetPath, setSelectedTargetPath] = useState<string>(getCleanTargetPath(project?.rootPath));

  useEffect(() => {
    setSelectedTargetPath(getCleanTargetPath(project?.rootPath));
  }, [project?.id, project?.rootPath]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle shortcuts with '?' (Shift + /) or 'Cmd + /'
      if ((e.key === '?' || (e.key === '/' && (e.metaKey || e.ctrlKey))) && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setShortcutsModalOpen(prev => !prev);
      }
      // Toggle theme with Cmd/Ctrl + Shift + T
      if (e.key.toLowerCase() === 't' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        toggleTheme();
      }
      // Trigger scan with Cmd/Ctrl + S
      if (e.key.toLowerCase() === 's' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        onScanRepo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme, onScanRepo]);

  if (!project) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="h-screen flex font-sans antialiased overflow-hidden bg-transparent">
      
      {/* Left Collapsible Navigation Sidebar */}
      {(() => {
        let savedResolved: string[] = [];
        try {
          const raw = localStorage.getItem('opspilot_resolved_patches');
          if (raw) savedResolved = JSON.parse(raw);
        } catch {}

        const findings = scan?.findings || [];
        const unresolvedCount = findings.filter(f => {
          if ((f as any).status === 'RESOLVED') return false;
          if (savedResolved.includes(f.id) || savedResolved.includes(f.title)) return false;
          if (f.filePath && savedResolved.includes(f.filePath)) return false;
          const baseKey = f.id.split('-').slice(-2).join('-');
          return !savedResolved.some(id => id.includes(baseKey));
        }).length;

        const effectiveScore = findings.length > 0
          ? (unresolvedCount === 0 ? 100 : unresolvedCount === 1 ? 89 : (scan?.overallScore ?? 78))
          : (scan?.overallScore ?? 78);

        return (
          <Sidebar 
            incidents={incidents} 
            scanScore={effectiveScore} 
            project={project} 
            projects={projects}
            onSelectProject={onSelectProject}
            onOpenSetupModal={onOpenSetupModal}
          />
        );
      })()}

      {/* Main Right Content Section — full height, scrollable */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Top Header Bar — sticky at top */}
        <Header
          project={project}
          projects={projects}
          scan={scan}
          onSelectProject={onSelectProject}
          onOpenSetupModal={onOpenSetupModal}
          onOpenShortcuts={() => setShortcutsModalOpen(true)}
          onResetEnv={onResetEnv}
          onScanRepo={onScanRepo}
          isScanning={isScanning}
          selectedTargetPath={selectedTargetPath}
          onSelectTargetPath={(path) => setSelectedTargetPath(path)}
        />

        {/* Page Content — scrollable area */}
        <main className="flex-1 overflow-y-auto w-full flex flex-col">
          <div className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet context={{ selectedTargetPath, onSelectTargetPath: setSelectedTargetPath, project }} />
          </div>
          
          {/* Footer inside scroll area */}
          <footer className="border-t theme-border bg-transparent py-4 px-4 sm:px-8 text-xs text-subtitle flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
            <span>D-OpsPilot AI — Enterprise Production Commander & GitHub Auditor</span>
            <span className="font-mono font-semibold">Project: {project.name}</span>
          </footer>
        </main>

      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
        onNavigate={(path) => navigate(path)}
        onScanRepo={onScanRepo}
        onToggleTheme={toggleTheme}
      />

    </div>
  );
};
