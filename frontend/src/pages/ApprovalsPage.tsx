import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Check, ShieldAlert, CheckCircle2, CheckSquare, Folder } from 'lucide-react';
import { Incident } from '../types';
import { approveFix, rejectFix } from '../services/api';
import { DiffViewer } from '../components/DiffViewer';
import { useOutletContext } from 'react-router-dom';

interface ApprovalsPageProps {
  incidents: Incident[];
  onRefreshIncidents: () => void;
}

export const ApprovalsPage: React.FC<ApprovalsPageProps> = ({ incidents, onRefreshIncidents }) => {
  const outletCtx = useOutletContext<{ selectedTargetPath?: string }>();
  const activeTargetPath = outletCtx?.selectedTargetPath || '/home/ubuntu/finance-lock';
  const isVacantPath = Boolean(activeTargetPath) && activeTargetPath !== '/home/ubuntu/finance-lock';

  const filteredIncidents = isVacantPath ? [] : incidents;

  const allApprovals = filteredIncidents
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
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.35 }}
      className="space-y-6 max-w-5xl mx-auto font-sans"
    >
      
      {/* Page Header */}
      <div className="glass-panel p-6 rounded-2xl theme-border border space-y-1">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-semibold font-mono">
            Human-in-the-Loop Safety Guardrails
          </span>
        </div>
        <h1 className="text-2xl font-bold text-title tracking-tight">Operational Approvals Queue</h1>
        <p className="text-xs text-subtitle max-w-2xl leading-relaxed">
          D-OpsPilot AI pauses execution before taking write actions, service restarts, database updates, or code patches. Review diffs and risk metrics below.
        </p>
      </div>

      {/* Vacant Path Banner */}
      {isVacantPath && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-mono flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Target Path <b>{activeTargetPath}</b> is vacant (0 active incidents/approvals). Active stack is at <b>/home/ubuntu/finance-lock</b>.</span>
          </div>
        </div>
      )}

      {/* Pending Approvals Section */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-subtitle uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Pending Execution Requests ({pendingApprovals.length})</span>
        </h2>

        {pendingApprovals.length === 0 ? (
          <div className="glass-panel p-10 rounded-2xl theme-border border text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-title">No Pending Approval Requests</h3>
              <p className="text-xs text-subtitle max-w-md mx-auto">
                All production environment policies and service recovery actions have been executed or reviewed. Trigger a failure scenario in Sandbox Control to test the safety queue.
              </p>
            </div>
          </div>
        ) : (
          pendingApprovals.map(({ incident, approval }) => (
            <motion.div 
              key={approval.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6 rounded-2xl border-2 border-amber-500/40 space-y-4 shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b theme-border pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold">Incident #{incident.id}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 whitespace-nowrap shrink-0 inline-block">
                      Risk Level: {approval.riskLevel}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-title mt-0.5">{approval.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleReject(approval.id)}
                    className="px-4 py-2 card-bg-subtle hover:bg-rose-500 hover:text-white text-title text-xs font-bold rounded-xl border theme-border transition cursor-pointer"
                  >
                    Reject
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleApprove(approval.id)}
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold rounded-xl shadow-md glow-emerald transition cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve & Execute Fix</span>
                  </motion.button>
                </div>
              </div>

              <p className="text-xs text-subtitle leading-relaxed">{approval.description}</p>

              <DiffViewer diffText={approval.diff} commands={approval.commands} />

              <div className="card-bg-subtle p-3 rounded-xl border theme-border text-xs font-mono">
                <b className="text-title">Rollback Plan:</b> <span className="text-subtitle">{approval.rollbackPlan}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>

    </motion.div>
  );
};
