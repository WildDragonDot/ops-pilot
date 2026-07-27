import React from 'react';
import { CheckSquare, ShieldAlert, Check, X, Clock, Terminal } from 'lucide-react';
import { Incident } from '../types';
import { approveFix, rejectFix } from '../services/api';
import { DiffViewer } from '../components/DiffViewer';

interface ApprovalsPageProps {
  incidents: Incident[];
  onRefreshIncidents: () => void;
}

export const ApprovalsPage: React.FC<ApprovalsPageProps> = ({ incidents, onRefreshIncidents }) => {
  const allApprovals = incidents
    .filter(i => i.activeApproval)
    .map(i => ({ incident: i, approval: i.activeApproval! }));

  const pendingApprovals = allApprovals.filter(a => a.approval.status === 'PENDING');
  const pastApprovals = allApprovals.filter(a => a.approval.status !== 'PENDING');

  const handleApprove = async (approvalId: string) => {
    await approveFix(approvalId);
    onRefreshIncidents();
  };

  const handleReject = async (approvalId: string) => {
    await rejectFix(approvalId);
    onRefreshIncidents();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
            Human-in-the-Loop Guardrail Engine
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-white mt-1">Operational Approvals Queue</h1>
        <p className="text-xs text-slate-400 mt-1">
          OpsPilot AI pauses execution before taking write actions, service restarts, database updates, or code patches. Review diffs and risk metrics below.
        </p>
      </div>

      {/* Pending Approvals Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Pending Execution Requests ({pendingApprovals.length})</span>
        </h2>

        {pendingApprovals.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center text-xs text-slate-500">
            No pending approval requests. All systems operating cleanly under current policies.
          </div>
        ) : (
          pendingApprovals.map(({ incident, approval }) => (
            <div key={approval.id} className="glass-panel p-6 rounded-2xl border-2 border-amber-500/60 bg-slate-950/90 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-blue-400">Incident #{incident.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Risk Level: {approval.riskLevel}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5">{approval.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReject(approval.id)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(approval.id)}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve Fix</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-300">{approval.description}</p>

              <DiffViewer diffText={approval.diff} commands={approval.commands} />

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs text-slate-400">
                <b>Rollback Plan:</b> {approval.rollbackPlan}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Historical Approvals */}
      {pastApprovals.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h2 className="text-sm font-bold text-slate-400">Approval History</h2>
          
          <div className="space-y-3">
            {pastApprovals.map(({ incident, approval }) => (
              <div key={approval.id} className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400">#{incident.id}</span>
                    <span className="font-bold text-slate-200">{approval.title}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">{approval.description}</span>
                </div>

                <span className={`px-3 py-1 rounded-full font-bold border ${
                  approval.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                }`}>
                  {approval.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
