import React, { useState } from 'react';
import { 
  GitBranch, 
  ShieldCheck, 
  AlertTriangle, 
  Bug, 
  CheckCircle2, 
  FileCode, 
  Search, 
  RefreshCw, 
  Check, 
  Zap,
  ArrowRight,
  Lock
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

  const findings = scan?.findings || [];
  
  const filteredFindings = findings.filter(f => {
    const matchesCategory = selectedCategory === 'ALL' || f.category.toUpperCase() === selectedCategory;
    const matchesSearch = searchQuery.trim() === '' || 
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (f.filePath && f.filePath.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const selectedFinding = findings.find(f => f.id === selectedFindingId) || filteredFindings[0] || findings[0];

  const handleApplyPatch = (findingId: string) => {
    setPatchAppliedId(findingId);
    setTimeout(() => {
      setPatchAppliedId(null);
    }, 3000);
  };

  const scores = [
    { label: 'Security Score', value: scan?.securityScore || 72, color: 'text-emerald-500', bar: 'bg-emerald-500' },
    { label: 'Code Quality', value: scan?.qualityScore || 80, color: 'text-blue-500', bar: 'bg-blue-500' },
    { label: 'Test Coverage', value: scan?.testingScore || 65, color: 'text-amber-500', bar: 'bg-amber-500' },
    { label: 'Reliability', value: scan?.reliabilityScore || 88, color: 'text-indigo-500', bar: 'bg-indigo-500' },
    { label: 'Documentation', value: scan?.documentationScore || 90, color: 'text-purple-500', bar: 'bg-purple-500' },
    { label: 'Maintainability', value: scan?.maintainabilityScore || 82, color: 'text-teal-500', bar: 'bg-teal-500' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Repository Banner Card */}
      <div className="glass-panel p-6 rounded-2xl theme-border border space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 text-xs font-semibold">
                GitHub Repository Auditor
              </span>
              <span className="text-xs font-mono text-subtitle">Branch: main</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 card-bg-subtle border theme-border rounded-xl text-blue-500">
                <GitBranch className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-title">company/production-backend-api</h1>
                <p className="text-xs text-subtitle">
                  Last Scanned: {scan?.completedAt ? new Date(scan.completedAt).toLocaleString() : 'Just now'} • {findings.length} findings detected
                </p>
              </div>
            </div>
          </div>

          {/* Overall Health Score Ring Card */}
          <div className="flex items-center gap-6 card-bg-subtle p-4 rounded-xl border theme-border">
            <div className="text-center">
              <span className="text-xs font-bold text-subtitle block uppercase tracking-wider">Overall Score</span>
              <div className="flex items-baseline justify-center gap-1 mt-0.5">
                <span className="text-3xl font-extrabold text-emerald-500">{scan?.overallScore || 78}</span>
                <span className="text-xs text-subtitle">/ 100</span>
              </div>
            </div>

            <button
              onClick={onScanRepo}
              disabled={isScanning}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg glow-blue transition"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning...' : 'Run AI Audit'}</span>
            </button>
          </div>

        </div>

        {/* 6 Category Radar Scores Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t theme-border">
          {scores.map((sc, i) => (
            <div key={i} className="card-bg-subtle p-3 rounded-xl border theme-border space-y-1.5">
              <span className="text-[10px] font-bold text-subtitle block truncate">{sc.label}</span>
              <div className="flex items-baseline justify-between font-mono">
                <span className={`text-base font-extrabold ${sc.color}`}>{sc.value}%</span>
              </div>
              <div className="w-full card-bg-subtle h-1.5 rounded-full overflow-hidden border theme-border">
                <div className={`${sc.bar} h-full rounded-full`} style={{ width: `${sc.value}%` }} />
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-xl theme-border border">
        
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 card-bg-subtle p-1 rounded-xl border theme-border overflow-x-auto">
          {['ALL', 'SECURITY', 'BUG', 'QUALITY'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-subtitle hover:text-title'
              }`}
            >
              {cat === 'ALL' ? 'All Findings' : cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2 theme-input px-3 py-1.5 rounded-xl border theme-border text-xs w-full sm:w-72">
          <Search className="w-4 h-4 text-subtitle shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search findings or files..."
            className="w-full bg-transparent border-none text-title focus:outline-none placeholder:text-subtitle text-xs"
          />
        </div>

      </div>

      {/* Main Content Split Grid: Findings List + Monaco Split Diff Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Filtered Findings List */}
        <div className="lg:sticky lg:top-6 space-y-3">
          <h2 className="text-xs font-bold text-subtitle uppercase tracking-wider">Detected Code Risks ({filteredFindings.length})</h2>
          
          {filteredFindings.length === 0 ? (
            <div className="glass-panel p-8 rounded-xl theme-border border text-center text-xs text-subtitle">
              No code risks matching filter.
            </div>
          ) : (
            filteredFindings.map((f) => {
              const isSelected = selectedFinding?.id === f.id;
              const severityColor = 
                f.severity === 'CRITICAL' ? 'status-danger' :
                f.severity === 'HIGH' ? 'status-warning' :
                'status-healthy';

              return (
                <div
                  key={f.id}
                  onClick={() => setSelectedFindingId(f.id)}
                  className={`p-4 rounded-xl transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg glow-blue scale-[1.01]' 
                      : 'glass-panel theme-border hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase tracking-wider ${
                      isSelected 
                        ? 'bg-white/20 text-white border-white/30' 
                        : severityColor
                    }`}>
                      {f.severity}
                    </span>
                    <span className={`text-[10px] font-mono font-medium ${isSelected ? 'text-blue-100' : 'text-subtitle'}`}>
                      {f.category}
                    </span>
                  </div>

                  <h3 className={`text-xs font-extrabold line-clamp-1 ${isSelected ? 'text-white' : 'text-title'}`}>
                    {f.title}
                  </h3>

                  {f.filePath && (
                    <div className={`flex items-center gap-1.5 mt-2 text-[11px] font-mono p-1.5 rounded border truncate ${
                      isSelected 
                        ? 'bg-black/20 text-blue-100 border-white/20' 
                        : 'card-bg-subtle text-subtitle theme-border'
                    }`}>
                      <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-blue-500'}`} />
                      <span className="truncate">{f.filePath}:{f.line || 1}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Finding Details & Monaco Patch Inspector */}
        <div className="lg:col-span-2 space-y-6">
          {selectedFinding ? (
            <>
              {/* Finding Header Card */}
              <div className="glass-panel p-6 rounded-2xl theme-border border space-y-4">
                <div className="flex items-start justify-between gap-4 border-b theme-border pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 dark:border-rose-500/30">
                        {selectedFinding.severity}
                      </span>
                      <span className="text-xs font-mono text-subtitle">{selectedFinding.category}</span>
                    </div>
                    <h2 className="text-lg font-bold text-title mt-1">{selectedFinding.title}</h2>
                  </div>

                  <button
                    onClick={() => handleApplyPatch(selectedFinding.id)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg glow-emerald transition whitespace-nowrap"
                  >
                    {patchAppliedId === selectedFinding.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Patch Applied</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Apply Security Patch</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Impact & Security Recommendation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="card-bg-subtle p-4 rounded-xl border theme-border space-y-1">
                    <span className="font-bold text-rose-700 dark:text-rose-400 block">Security Impact</span>
                    <p className="text-title font-medium leading-relaxed">{selectedFinding.impact}</p>
                  </div>

                  <div className="card-bg-subtle p-4 rounded-xl border theme-border space-y-1">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 block">AI Recommendation</span>
                    <p className="text-title font-medium leading-relaxed">{selectedFinding.recommendation}</p>
                  </div>
                </div>

                {/* Monaco Split Code Diff Viewer */}
                {selectedFinding.patch && (
                  <DiffViewer
                    diffText={selectedFinding.patch}
                    title={`Code Patch: ${selectedFinding.filePath || 'Source Patch'}`}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="glass-panel p-12 rounded-2xl theme-border border text-center text-subtitle text-xs">
              Select a finding from the left panel to inspect security impact and code diff patches.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
