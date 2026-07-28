import React from 'react';

/**
 * Reusable Basic Skeleton Block
 */
export const SkeletonBlock: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return <div className={`skeleton-box ${className}`} />;
};

/**
 * Dashboard Page Skeleton
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12 animate-fadeIn">
      {/* Top Banner Skeleton */}
      <div className="glass-panel p-6 rounded-2xl theme-border border flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-2.5 w-full md:w-2/3">
          <SkeletonBlock className="h-5 w-36 rounded-full" />
          <SkeletonBlock className="h-8 w-64 rounded-xl" />
          <SkeletonBlock className="h-4 w-full max-w-xl rounded-lg" />
        </div>
        <div className="flex gap-3 shrink-0">
          <SkeletonBlock className="h-10 w-32 rounded-xl" />
          <SkeletonBlock className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* 4 Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-panel p-5 rounded-2xl theme-border border space-y-3">
            <div className="flex justify-between items-center">
              <SkeletonBlock className="h-3 w-24 rounded" />
              <SkeletonBlock className="h-5 w-5 rounded-full" />
            </div>
            <SkeletonBlock className="h-9 w-32 rounded-xl" />
            <div className="pt-2 border-t theme-border flex justify-between">
              <SkeletonBlock className="h-3 w-20 rounded" />
              <SkeletonBlock className="h-3 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Topology Graph + Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl theme-border border space-y-4">
          <div className="flex justify-between items-center">
            <SkeletonBlock className="h-6 w-48 rounded-xl" />
            <SkeletonBlock className="h-8 w-24 rounded-lg" />
          </div>
          <SkeletonBlock className="h-[320px] w-full rounded-2xl" />
        </div>

        <div className="glass-panel p-6 rounded-2xl theme-border border space-y-4">
          <SkeletonBlock className="h-6 w-40 rounded-xl" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3.5 rounded-xl card-bg-subtle border theme-border space-y-2">
                <SkeletonBlock className="h-4 w-3/4 rounded-md" />
                <SkeletonBlock className="h-3 w-full rounded-md" />
                <SkeletonBlock className="h-3 w-1/2 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Repo Auditor Skeleton Loader
 */
export const RepoAuditorSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12 animate-fadeIn">
      {/* Top Banner Skeleton */}
      <div className="glass-panel p-6 rounded-2xl theme-border border space-y-3">
        <div className="flex justify-between items-center">
          <SkeletonBlock className="h-7 w-56 rounded-xl" />
          <SkeletonBlock className="h-10 w-36 rounded-xl" />
        </div>
        <SkeletonBlock className="h-4 w-3/4 rounded-lg" />
      </div>

      {/* Audit Findings List Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl theme-border border space-y-4">
          <SkeletonBlock className="h-5 w-40 rounded-lg" />
          <SkeletonBlock className="h-32 w-full rounded-2xl" />
          <SkeletonBlock className="h-10 w-full rounded-xl" />
        </div>
        <div className="md:col-span-2 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-panel p-4 rounded-xl theme-border border flex justify-between items-center gap-4">
              <div className="space-y-2 w-full">
                <SkeletonBlock className="h-4 w-1/3 rounded-md" />
                <SkeletonBlock className="h-3 w-2/3 rounded-md" />
              </div>
              <SkeletonBlock className="h-8 w-20 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Incident Command Center Skeleton Loader
 */
export const CommandCenterSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 max-w-4xl mx-auto font-sans pb-6 animate-fadeIn">
      {/* Incident Header Control */}
      <div className="glass-panel p-4 rounded-xl theme-border border flex justify-between items-center">
        <SkeletonBlock className="h-6 w-48 rounded-xl" />
        <SkeletonBlock className="h-8 w-32 rounded-lg" />
      </div>

      {/* Active Incident Container Skeleton */}
      <div className="glass-panel p-6 rounded-2xl theme-border border space-y-4 min-h-[380px]">
        <SkeletonBlock className="h-7 w-3/4 rounded-xl" />
        <SkeletonBlock className="h-4 w-full rounded-lg" />
        <SkeletonBlock className="h-4 w-5/6 rounded-lg" />
        <div className="pt-4 border-t theme-border space-y-3">
          <SkeletonBlock className="h-16 w-full rounded-xl" />
          <SkeletonBlock className="h-24 w-full rounded-xl" />
        </div>
      </div>

      {/* Chat Editor Bar Skeleton */}
      <div className="glass-panel p-4 rounded-2xl theme-border border space-y-3">
        <SkeletonBlock className="h-12 w-full rounded-xl" />
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <SkeletonBlock className="h-6 w-20 rounded-lg" />
            <SkeletonBlock className="h-6 w-20 rounded-lg" />
          </div>
          <SkeletonBlock className="h-8 w-8 rounded-xl shrink-0" />
        </div>
      </div>
    </div>
  );
};

/**
 * Generic Page Skeleton Loader (Used for Approvals, Runbooks, Audit Logs, Settings, Sandbox)
 */
export const GenericPageSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl theme-border border flex justify-between items-center">
        <div className="space-y-2 w-1/2">
          <SkeletonBlock className="h-7 w-48 rounded-xl" />
          <SkeletonBlock className="h-4 w-full max-w-md rounded-lg" />
        </div>
        <SkeletonBlock className="h-10 w-32 rounded-xl shrink-0" />
      </div>

      {/* List / Table Cards Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="glass-panel p-5 rounded-xl theme-border border flex items-center justify-between gap-4">
            <div className="space-y-2.5 w-full">
              <SkeletonBlock className="h-5 w-2/5 rounded-md" />
              <SkeletonBlock className="h-3 w-4/5 rounded-md" />
            </div>
            <SkeletonBlock className="h-9 w-24 rounded-xl shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};
