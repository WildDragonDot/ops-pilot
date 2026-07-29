import { Project } from '../types';

export type OperatingMode = 'GITHUB_ONLY' | 'HYBRID_BOTH' | 'SERVER_ONLY' | 'LOCAL_SANDBOX';

export function getProjectOperatingMode(project: Project | null | undefined): OperatingMode {
  const hasGit = Boolean(project?.gitUrl?.trim());
  const hasServer = Boolean(project?.serverHost?.trim());

  if (hasGit && hasServer) return 'HYBRID_BOTH';
  if (hasGit && !hasServer) return 'GITHUB_ONLY';
  if (!hasGit && hasServer) return 'SERVER_ONLY';
  return 'LOCAL_SANDBOX';
}

export function getModeBadgeInfo(mode: OperatingMode) {
  switch (mode) {
    case 'HYBRID_BOTH':
      return {
        label: 'HYBRID (GIT + INFRA)',
        color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
        dotColor: 'bg-purple-500',
        description: 'Both GitHub Repository & SSH Server connected'
      };
    case 'GITHUB_ONLY':
      return {
        label: 'GITHUB AST MODE',
        color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
        dotColor: 'bg-blue-500',
        description: 'GitHub Repository connected without SSH server'
      };
    case 'SERVER_ONLY':
      return {
        label: 'INFRASTRUCTURE MODE',
        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        dotColor: 'bg-emerald-500',
        description: 'SSH Server Host connected without GitHub repo'
      };
    default:
      return {
        label: 'LOCAL SANDBOX',
        color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
        dotColor: 'bg-slate-400',
        description: 'Local workspace environment'
      };
  }
}
