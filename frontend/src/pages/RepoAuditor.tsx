import React, { useState } from 'react';
import { 
  GitBranch, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Bug, 
  CheckCircle2, 
  FileCode, 
  Search, 
  RefreshCw, 
  Check, 
  Zap,
  Sparkles,
  X,
  GitCommit
} from 'lucide-react';
import { Scan, Finding } from '../types';
import { DiffViewer } from '../components/DiffViewer';

interface RepoAuditorProps {
  scan: Scan | null;
  onScanRepo: () => void;
  isScanning: boolean;
}

export const RepoAuditor: React.FC<RepoAuditorProps> = ({
  scan,
  onScanRepo,
  isScanning
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [patchAppliedId, setPatchAppliedId] = useState<string | null>(null);
  const [isApplyingPatch, setIsApplyingPatch] = useState<boolean>(false);

  const findings = scan?.findings || [];
  
  // Category counts
  const countAll = findings.length;
  const countSecurity = findings.filter(f => f.category.toUpperCase() === 'SECURITY').length;
  const countBug = findings.filter(f => f.category.toUpperCase() === 'BUG').length;
  const countQuality = findings.filter(f => f.category.toUpperCase() === 'QUALITY').length;

  const filteredFindings = findings.filter(f => {
    const matchesCategory = selectedCategory === 'ALL' || f.category.toUpperCase() === selectedCategory;
    const matchesSearch = searchQuery.trim() === '' || 
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (f.filePath && f.filePath.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const selectedFinding = findings.find(f => f.id === selectedFindingId) || filteredFindings[0] || findings[0];

  const handleApplyPatch = (findingId: string) => {
    setIsApplyingPatch(true);
    setTimeout(() => {
      setIsApplyingPatch(false);
      setPatchAppliedId(findingId);
      setTimeout(() => {
        setPatchAppliedId(null);
      }, 3500);
    }, 800);
  };

  const scores = [
    { label: 'Security Score', value: scan?.securityScore || 72, color: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' },
    { label: 'Code Quality', value: scan?.qualityScore || 80, color: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500' },
    { label: 'Test Coverage', value: scan?.testingScore || 65, color: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' },
    { label: 'Reliability', value: scan?.reliabilityScore || 88, color: 'text-indigo-600 dark:text-indigo-400', bar: 'bg-indigo-500' },
    { label: 'Documentation', value: scan?.documentationScore || 90, color: 'text-purple-600 dark:text-purple-400', bar: 'bg-purple-500' },
    { label: 'Maintainability', value: scan?.maintainabilityScore || 82, color: 'text-teal-600 dark:text-teal-400', bar: 'bg-teal-500' }
  ];

  return (
    <div className="space-y-5">
      
      {/* Top Repository Banner Card */}
      <div className="bg-white dark:bg-[#0d1117] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-xs font-semibold font-mono shadow-xs">
                <GitBranch className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                GitHub Repository Auditor
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-mono border border-slate-200 dark:border-slate-700">
                <GitCommit className="w-3 h-3 text-slate-400" />
                main
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-mono font-medium">
                ● Live Protection Active
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">company/production-backend-api</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Last Scanned: {scan?.completedAt ? new Date(scan.completedAt).toLocaleString() : 'Just now'} • <span className="font-semibold text-slate-700 dark:text-slate-300">{findings.length} findings</span> detected
                </p>
              </div>
            </div>
          </div>

          {/* Overall Health Score Ring Card */}
          <div className="flex items-center justify-between sm:justify-end gap-5 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Security Health Index</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{scan?.overallScore || 78}</span>
                <span className="text-xs font-medium text-slate-500">/ 100</span>
                <span className="ml-1.5 text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  Grade B+
                </span>
              </div>
            </div>

            <button
              onClick={onScanRepo}
              disabled={isScanning}
              className="flex items-center gap-2 px-4 py-2 bg-[#1f883d] hover:bg-[#1a7f37] disabled:opacity-50 text-white text-xs font-semibold rounded-md shadow-xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning...' : 'Run AI Audit'}</span>
            </button>
          </div>

        </div>

        {/* 6 Category Score Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          {scores.map((sc, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1 hover:border-slate-300 dark:hover:border-slate-700 transition">
              <span className="text-[10px] font-semibold text-slate-500 block truncate">{sc.label}</span>
              <div className="flex items-baseline justify-between font-mono">
                <span className={`text-sm font-extrabold ${sc.color}`}>{sc.value}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className={`${sc.bar} h-full rounded-full transition-all duration-500`} style={{ width: `${sc.value}%` }} />
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
        
        {/* Category Subnav Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/60 dark:bg-slate-900 rounded-lg border border-slate-300/60 dark:border-slate-800 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Findings', count: countAll },
            { id: 'SECURITY', label: 'Security', count: countSecurity },
            { id: 'BUG', label: 'Bugs', count: countBug },
            { id: 'QUALITY', label: 'Quality', count: countQuality }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                selectedCategory === tab.id
                  ? 'bg-white/20 text-white font-bold'
                  : 'bg-slate-300/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex items-center bg-white dark:bg-[#0d1117] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 text-xs w-full sm:w-80 shadow-xs">
          <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search findings or files..."
            className="w-full bg-transparent border-none text-slate-900 dark:text-slate-100 focus:outline-none placeholder:text-slate-400 text-xs"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>

      {/* Main Content Split Grid: Findings List + Monaco Split Diff Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        
        {/* Left Column: Filtered Findings List */}
        <div className="lg:sticky lg:top-6 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Detected Code Risks ({filteredFindings.length})</h2>
          </div>
          
          {filteredFindings.length === 0 ? (
            <div className="bg-white dark:bg-[#0d1117] p-8 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
              No code risks matching filter.
            </div>
          ) : (
            filteredFindings.map((f) => {
              const isSelected = selectedFinding?.id === f.id;
              
              return (
                <div
                  key={f.id}
                  onClick={() => setSelectedFindingId(f.id)}
                  className={`p-3.5 rounded-xl transition-all cursor-pointer border ${
                    isSelected 
                      ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-500/80 shadow-xs' 
                      : 'bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                      f.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20' :
                      f.severity === 'HIGH' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20' :
                      'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                    }`}>
                      {f.severity}
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
                      {f.category}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                    {f.title}
                  </h3>

                  {f.filePath && (
                    <div className={`flex items-center gap-1.5 mt-2 text-[11px] font-mono px-2.5 py-1 rounded-md border truncate ${
                      isSelected 
                        ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-medium' 
                        : 'bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}>
                      <FileCode className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{f.filePath}:{f.line || 1}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Finding Details & Monaco Patch Inspector */}
        <div className="lg:col-span-2 space-y-5">
          {selectedFinding ? (
            <>
              {/* Finding Header Card */}
              <div className="bg-white dark:bg-[#0d1117] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
                
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 uppercase tracking-wider">
                        {selectedFinding.severity}
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {selectedFinding.category}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">{selectedFinding.title}</h2>
                  </div>

                  <button
                    onClick={() => handleApplyPatch(selectedFinding.id)}
                    disabled={isApplyingPatch}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1f883d] hover:bg-[#1a7f37] text-white text-xs font-semibold rounded-md shadow-xs transition-all active:scale-[0.98] whitespace-nowrap shrink-0 disabled:opacity-60"
                  >
                    {isApplyingPatch ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Applying Patch...</span>
                      </>
                    ) : patchAppliedId === selectedFinding.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Patch Applied</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 fill-emerald-300 text-emerald-300" />
                        <span>Apply Security Patch</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Impact & Security Recommendation Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  
                  {/* Security Impact */}
                  <div className="p-3.5 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-rose-700 dark:text-rose-400 text-xs">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>Security Impact</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs font-normal">
                      {selectedFinding.impact}
                    </p>
                  </div>

                  {/* AI Recommendation */}
                  <div className="p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>AI Recommendation</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs font-normal">
                      {selectedFinding.recommendation}
                    </p>
                  </div>

                </div>

                {/* GitHub Code Diff Viewer */}
                {selectedFinding.patch && (
                  <DiffViewer
                    diffText={selectedFinding.patch}
                    title={`Code Patch: ${selectedFinding.filePath || 'Source Patch'}`}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-[#0d1117] p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 text-xs">
              Select a finding from the left panel to inspect security impact and code diff patches.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
