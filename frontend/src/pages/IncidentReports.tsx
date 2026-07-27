import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Incident } from '../types';

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

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            Post-Mortem Intelligence
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-white mt-1">Incident Post-Mortem Reports</h1>
        <p className="text-xs text-slate-400 mt-1">
          Automated post-incident reports documenting executive summaries, evidence traces, approved recovery actions, verification checklists, and preventive architectural rules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Reports</h2>
          {resolvedIncidents.length === 0 ? (
            <div className="glass-panel p-6 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
              No post-mortem reports generated yet. Resolve an incident in the Command Center to generate a post-mortem.
            </div>
          ) : (
            resolvedIncidents.map(inc => {
              const isSelected = selectedIncident?.id === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncidentId(inc.id)}
                  className={`glass-panel p-4 rounded-xl border cursor-pointer transition ${
                    isSelected ? 'border-emerald-500 bg-slate-900/90 shadow-md' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-emerald-400">#{inc.id}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-100 mt-1 line-clamp-1">{inc.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">Resolved via approved fix</p>
                </div>
              );
            })
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selectedIncident?.report ? (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-mono text-emerald-400">Report ID: {selectedIncident.id}</span>
                  <h2 className="text-lg font-bold text-white mt-0.5">Post-Mortem: {selectedIncident.title}</h2>
                </div>

                <button
                  onClick={handleCopyReport}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied Markdown' : 'Copy Markdown'}</span>
                </button>
              </div>

              <div className="prose prose-invert max-w-none text-xs text-slate-300 space-y-4 leading-relaxed font-sans">
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 font-mono whitespace-pre-wrap overflow-x-auto text-[11px]">
                  {selectedIncident.report}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs">
              Select a post-mortem report from the left panel to inspect full markdown documentation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
