import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Download } from 'lucide-react';
import { Incident } from '../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

interface IncidentReportsProps {
  incidents: Incident[];
}

export const IncidentReports: React.FC<IncidentReportsProps> = ({ incidents }) => {
  const resolvedIncidents = incidents.filter(i => i.report);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    resolvedIncidents.length > 0 ? resolvedIncidents[0].id : null
  );
  const [copied, setCopied] = useState<boolean>(false);

  const selectedIncident = resolvedIncidents.find(i => i.id === selectedIncidentId) || resolvedIncidents[0];

  const handleCopyReport = () => {
    if (selectedIncident?.report) {
      navigator.clipboard.writeText(selectedIncident.report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadMarkdown = () => {
    if (selectedIncident?.report) {
      const blob = new Blob([selectedIncident.report], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Post-Mortem-${selectedIncident.id}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.35 }}
      className="space-y-6 max-w-5xl mx-auto font-sans"
    >
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0d1117] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-xs font-semibold font-mono">
              Executive Post-Mortem Exporter
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Incident Post-Mortem Reports</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Automated post-incident reports documenting executive summaries, evidence traces, approved recovery actions, verification checklists, and preventive rules.
          </p>
        </div>

        {selectedIncident?.report && (
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <Download className="w-4 h-4" />
              <span>Download .md</span>
            </button>
            <button
              onClick={handleCopyReport}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:sticky lg:top-6 space-y-2.5">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">Available Reports</h2>
          {resolvedIncidents.length === 0 ? (
            <div className="bg-white dark:bg-[#0d1117] p-6 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
              No post-mortem reports generated yet. Resolve an incident in the Command Center to generate a post-mortem.
            </div>
          ) : (
            resolvedIncidents.map(inc => {
              const isSelected = selectedIncident?.id === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncidentId(inc.id)}
                  className={`p-3.5 rounded-xl transition-all cursor-pointer border ${
                    isSelected 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.01]' 
                      : 'bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-xs font-mono font-bold ${
                      isSelected ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      #{inc.id}
                    </span>
                    <span className={`text-[10px] font-mono ${
                      isSelected ? 'text-blue-100' : 'text-slate-400'
                    }`}>
                      {inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <h3 className={`text-xs font-bold line-clamp-1 ${
                    isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'
                  }`}>
                    {inc.title}
                  </h3>
                  <p className={`text-[11px] mt-0.5 line-clamp-1 ${
                    isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    Resolved via approved fix
                  </p>
                </div>
              );
            })
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedIncident?.report ? (
            <div className="bg-white dark:bg-[#0d1117] p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="text-xs font-semibold text-slate-500 font-mono">Executive Post-Mortem Report #{selectedIncident.id}</span>
                <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold font-mono">
                  ● RESOLVED
                </span>
              </div>
              
              <MarkdownRenderer content={selectedIncident.report} />
            </div>
          ) : (
            <div className="bg-white dark:bg-[#0d1117] p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
              Select an incident from the left list to view its post-mortem report.
            </div>
          )}
        </div>
      </div>

    </motion.div>
  );
};
