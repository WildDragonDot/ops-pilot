import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Bug, 
  CheckCircle2, 
  GitCommit, 
  FileCode, 
  RefreshCw, 
  ChevronRight,
  Sparkles,
  Lock,
  Zap,
  Code
} from 'lucide-react';
import { Scan, Finding } from '../types';
import { DiffViewer } from '../components/DiffViewer';

interface RepoAuditorProps {
  scan: Scan | null;
  onScanRepo: () => void;
  isScanning: boolean;
}

export const RepoAuditor: React.FC<RepoAuditorProps> = ({ scan, onScanRepo, isScanning }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeFindingId, setActiveFindingId] = useState<string | null>(null);

  if (!scan) return null;

  const findings = scan.findings || [];
  const filteredFindings = selectedCategory === 'ALL' 
    ? findings 
    : findings.filter(f => f.category === selectedCategory);

  const activeFinding = findings.find(f => f.id === activeFindingId);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
              GitHub Intelligence Agent
            </span>
            <span className="text-xs font-mono text-slate-400">repo: company/production-backend-api</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">GitHub Repository Auditor</h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated code quality, security vulnerability scanner, bug hunter, missing test detector, and commit risk analyzer.
          </p>
        </div>

        <button
          onClick={onScanRepo}
          disabled={isScanning}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 transition self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'Scanning Codebase...' : 'Re-Scan Repository'}</span>
        </button>
      </div>

      {/* Score Breakdown Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        <div className="glass-panel p-4 rounded-xl space-y-1 text-center border-t-2 border-t-emerald-500">
          <span className="text-[11px] text-slate-400 font-semibold uppercase">Overall</span>
          <div className="text-2xl font-extrabold text-white">{scan.overallScore}/100</div>
          <span className="text-[10px] text-emerald-400">Grade B+</span>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1 text-center border-t-2 border-t-rose-500">
          <span className="text-[11px] text-slate-400 font-semibold uppercase">Security (25%)</span>
          <div className="text-2xl font-extrabold text-rose-400">{scan.securityScore}/100</div>
          <span className="text-[10px] text-rose-400 font-medium">2 Secrets Found</span>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1 text-center border-t-2 border-t-blue-500">
          <span className="text-[11px] text-slate-400 font-semibold uppercase">Code Quality (20%)</span>
          <div className="text-2xl font-extrabold text-blue-400">{scan.qualityScore}/100</div>
          <span className="text-[10px] text-slate-400">Good</span>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1 text-center border-t-2 border-t-amber-500">
          <span className="text-[11px] text-slate-400 font-semibold uppercase">Testing (20%)</span>
          <div className="text-2xl font-extrabold text-amber-400">{scan.testingScore}/100</div>
          <span className="text-[10px] text-amber-400">Coverage 54%</span>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1 text-center border-t-2 border-t-purple-500">
          <span className="text-[11px] text-slate-400 font-semibold uppercase">Reliability (15%)</span>
          <div className="text-2xl font-extrabold text-purple-400">{scan.reliabilityScore}/100</div>
          <span className="text-[10px] text-purple-400">High</span>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1 text-center border-t-2 border-t-indigo-500">
          <span className="text-[11px] text-slate-400 font-semibold uppercase">Doc & Maint</span>
          <div className="text-2xl font-extrabold text-indigo-400">{scan.documentationScore}/100</div>
          <span className="text-[10px] text-slate-400">Complete</span>
        </div>

      </div>

      {/* Main Audit Content: Category Filters + Finding List + Patch Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Category Nav & Findings List */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'ALL', label: `All Findings (${findings.length})`, icon: ShieldCheck },
              { id: 'SECURITY', label: 'Security Secrets', icon: Lock },
              { id: 'BUG', label: 'Bug Hunter', icon: Bug },
              { id: 'COMMIT_RISK', label: 'Commit Risk', icon: GitCommit },
              { id: 'TESTING', label: 'Missing Tests', icon: FileCode },
            ].map(tab => {
              const Icon = tab.icon;
              const active = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    active 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Findings List */}
          <div className="space-y-3">
            {filteredFindings.map(finding => {
              const isSelected = activeFindingId === finding.id;
              const severityColor = 
                finding.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                finding.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                'bg-blue-500/20 text-blue-400 border-blue-500/30';

              return (
                <div
                  key={finding.id}
                  onClick={() => setActiveFindingId(finding.id)}
                  className={`glass-panel p-4 rounded-xl border cursor-pointer transition ${
                    isSelected ? 'border-blue-500 bg-slate-900/90 shadow-lg shadow-blue-500/10' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${severityColor}`}>
                          {finding.severity}
                        </span>
                        <span className="text-xs font-mono text-purple-400">{finding.category}</span>
                        {finding.filePath && (
                          <span className="text-xs font-mono text-slate-400">
                            {finding.filePath}:{finding.line}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-100">{finding.title}</h3>
                      <p className="text-xs text-slate-300 line-clamp-2">{finding.impact}</p>
                    </div>

                    <ChevronRight className={`w-5 h-5 text-slate-500 transition-transform ${isSelected ? 'rotate-90 text-blue-400' : ''}`} />
                  </div>

                  {/* Recommendation snippet */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                    <span><b>Fix Recommendation:</b> {finding.recommendation}</span>
                    {finding.patch && (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Patch Ready
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Col: Selected Finding Inspector & Patch Preview */}
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 sticky top-20">
            <h2 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
              <Code className="w-4 h-4 text-blue-400" />
              <span>Finding Inspector & Code Patch</span>
            </h2>

            {activeFinding ? (
              <div className="space-y-4 mt-4">
                <div>
                  <span className="text-xs font-mono text-purple-400">{activeFinding.category}</span>
                  <h3 className="text-base font-bold text-white">{activeFinding.title}</h3>
                  <p className="text-xs text-slate-300 mt-1">{activeFinding.impact}</p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Target Location:</span>
                  <code className="text-xs text-blue-400 font-mono block">
                    {activeFinding.filePath}:{activeFinding.line}
                  </code>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-300">Recommended Action:</span>
                  <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    {activeFinding.recommendation}
                  </p>
                </div>

                {activeFinding.patch ? (
                  <div>
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mb-2">
                      <Sparkles className="w-3.5 h-3.5" /> AI Generated Diff Patch:
                    </span>
                    <DiffViewer diffText={activeFinding.patch} />
                  </div>
                ) : (
                  <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                    No automated patch required for this structural finding. Follow recommendation steps in code review.
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-slate-500 space-y-2">
                <FileCode className="w-8 h-8 mx-auto text-slate-600" />
                <p>Select any finding from the audit list on the left to inspect detailed line locations and AI diff patches.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
