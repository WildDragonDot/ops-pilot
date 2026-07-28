import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Search, 
  Download, 
  Filter, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertOctagon, 
  Terminal, 
  FileCode,
  Lock,
  RefreshCw
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  userEmail: string;
  action: string;
  category: 'AUTH' | 'APPROVAL' | 'CODE_PATCH' | 'FAILURE_INJECTION' | 'SCAN';
  target: string;
  ipAddress: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  details: string;
}

export const AuditLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const logs: AuditLogEntry[] = [
    {
      id: 'log-1094',
      timestamp: '2026-07-28 07:30:15',
      user: 'Chandan Vishwakarma',
      userEmail: 'admin@opspilot.ai',
      action: 'APPROVED_INCIDENT_FIX',
      category: 'APPROVAL',
      target: 'Incident #inc-1785183161671',
      ipAddress: '192.168.1.104',
      status: 'SUCCESS',
      details: 'Approved code patch for req.params.id integer parsing in auth.controller.ts.'
    },
    {
      id: 'log-1093',
      timestamp: '2026-07-28 07:15:02',
      user: 'OpsPilot Autonomous Agent',
      userEmail: 'agent@system.internal',
      action: 'TRIGGERED_REPO_SCAN',
      category: 'SCAN',
      target: 'company/production-backend-api',
      ipAddress: '127.0.0.1',
      status: 'SUCCESS',
      details: 'Completed security & code quality audit (Score: 78/100, 3 findings).'
    },
    {
      id: 'log-1092',
      timestamp: '2026-07-28 06:45:22',
      user: 'Chandan Vishwakarma',
      userEmail: 'admin@opspilot.ai',
      action: 'INJECTED_FAILURE_SCENARIO',
      category: 'FAILURE_INJECTION',
      target: 'Sandbox Environment (DATABASE_STOPPED)',
      ipAddress: '192.168.1.104',
      status: 'WARNING',
      details: 'Simulated PostgreSQL container crash to test autonomous recovery loop.'
    },
    {
      id: 'log-1091',
      timestamp: '2026-07-28 06:10:44',
      user: 'Chandan Vishwakarma',
      userEmail: 'admin@opspilot.ai',
      action: 'USER_LOGIN',
      category: 'AUTH',
      target: 'OpsPilot Workspace',
      ipAddress: '192.168.1.104',
      status: 'SUCCESS',
      details: 'User authenticated via JWT Bearer Token Session.'
    },
    {
      id: 'log-1090',
      timestamp: '2026-07-27 22:40:11',
      user: 'DevOps Lead',
      userEmail: 'lead@opspilot.ai',
      action: 'UPDATED_WORKSPACE_SETTINGS',
      category: 'AUTH',
      target: 'Guardrails & Safety Rules',
      ipAddress: '10.0.4.12',
      status: 'SUCCESS',
      details: 'Set requireApprovalForWriteActions = true.'
    }
  ];

  const filteredLogs = logs.filter(log => {
    const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleExportCSV = () => {
    const csvContent = [
      ['ID', 'Timestamp', 'User', 'Action', 'Category', 'Target', 'IP Address', 'Status', 'Details'].join(','),
      ...filteredLogs.map(l => [
        l.id,
        `"${l.timestamp}"`,
        `"${l.user}"`,
        `"${l.action}"`,
        l.category,
        `"${l.target}"`,
        l.ipAddress,
        l.status,
        `"${l.details}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `opspilot_audit_logs_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto font-sans pb-12"
    >
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl theme-border border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-semibold font-mono">
              SOC 2 / ISO 27001 Compliance Audit Trail
            </span>
          </div>
          <h1 className="text-2xl font-bold text-title tracking-tight">Audit & Security Logs</h1>
          <p className="text-xs text-subtitle max-w-2xl leading-relaxed">
            Immutable system activity log recording all user actions, autonomous AI recovery executions, code approvals, and failure injections.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit CSV</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl theme-border border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 theme-input px-3 py-2 rounded-xl border theme-border w-full sm:w-80">
          <Search className="w-4 h-4 text-subtitle shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter logs by action, user, or target..."
            className="w-full bg-transparent border-none text-xs text-title focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500/50 placeholder:opacity-50"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'APPROVAL', 'SCAN', 'FAILURE_INJECTION', 'AUTH'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'card-bg-subtle text-subtitle hover:text-title border theme-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel rounded-2xl theme-border border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b theme-border card-bg-subtle text-[11px] font-mono font-bold text-subtitle uppercase tracking-wider">
                <th className="p-4">Timestamp</th>
                <th className="p-4">User Identity</th>
                <th className="p-4">Action Event</th>
                <th className="p-4">Category</th>
                <th className="p-4">Target Resource</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y theme-border text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-subtitle">
                    No matching audit log entries found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-blue-500/5 transition">
                    <td className="p-4 font-mono text-subtitle text-[11px] whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-title">{log.user}</div>
                      <div className="text-[10px] font-mono text-subtitle">{log.userEmail}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400">
                        {log.action}
                      </span>
                      <div className="text-[11px] text-subtitle mt-0.5 line-clamp-1">{log.details}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold card-bg-subtle border theme-border">
                        {log.category}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-title text-[11px]">
                      {log.target}
                    </td>
                    <td className="p-4 font-mono text-subtitle text-[11px]">
                      {log.ipAddress}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase ${
                        log.status === 'SUCCESS' ? 'status-healthy' : 'status-warning'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </motion.div>
  );
};
