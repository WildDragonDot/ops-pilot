import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  Loader2
} from 'lucide-react';
import { fetchAuditLogs } from '../services/api';
import { useOutletContext } from 'react-router-dom';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  userEmail: string;
  action: string;
  category: 'AUTH' | 'INCIDENT' | 'APPROVAL' | 'CODE_PATCH' | 'FAILURE_INJECTION' | 'SCAN';
  target: string;
  ipAddress: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  details: string;
}

export const AuditLogs: React.FC = () => {
  const outletCtx = useOutletContext<{ selectedTargetPath?: string; project?: any }>();
  const activeTargetPath = outletCtx?.selectedTargetPath || '/home/ubuntu/finance-lock';
  const isVacantPath = Boolean(activeTargetPath) && activeTargetPath !== '/home/ubuntu/finance-lock';
  const project = outletCtx?.project;

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadRealLogs = async () => {
    try {
      setIsLoading(true);
      const data = await fetchAuditLogs(project?.id);
      setLogs(isVacantPath ? [] : data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRealLogs();
  }, [project?.id, isVacantPath]);


  const filteredLogs = logs.filter(log => {
    const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;
    const query = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      log.action.toLowerCase().includes(query) ||
      log.user.toLowerCase().includes(query) ||
      log.target.toLowerCase().includes(query) ||
      log.details.toLowerCase().includes(query) ||
      log.ipAddress.toLowerCase().includes(query);
    return matchesCategory && matchesStatus && matchesSearch;
  });

  // Reset to page 1 on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedStatus, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

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
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit CSV</span>
        </button>
      </div>

      {/* Filter & Search Controls Bar */}
      <div className="glass-panel p-4 rounded-2xl theme-border border space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Live Search Input */}
          <div className="flex items-center gap-2 theme-input px-3.5 py-2 rounded-xl border theme-border w-full md:w-80 shadow-xs">
            <Search className="w-4 h-4 text-blue-500 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by action, user, target or IP..."
              className="w-full bg-transparent border-none text-xs text-title focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500/50"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="text-xs text-subtitle hover:text-title font-bold px-1"
              >
                ×
              </button>
            )}
          </div>

          {/* Category & Status Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto p-1 rounded-xl card-bg-subtle border theme-border">
              {['ALL', 'INCIDENT', 'APPROVAL', 'SCAN', 'FAILURE_INJECTION', 'AUTH'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-subtitle hover:text-title'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Status Dropdown Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold card-bg-subtle text-title border theme-border cursor-pointer focus:outline-none"
            >
              <option value="ALL">Status: All</option>
              <option value="SUCCESS">Status: SUCCESS</option>
              <option value="WARNING">Status: WARNING</option>
              <option value="FAILED">Status: FAILED</option>
            </select>
          </div>
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
            <tbody className="divide-y theme-border text-xs font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-subtitle">
                    <div className="flex items-center justify-center gap-2 font-mono">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      <span>Loading audit logs...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-subtitle font-mono">
                    No matching audit log entries found for search/filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map(log => {
                  const parts = log.timestamp.split(' ');
                  const datePart = parts[0] || log.timestamp;
                  const timePart = parts.slice(1).join(' ');

                  return (
                    <tr key={log.id} className="hover:bg-blue-500/5 transition">
                      <td className="p-4 font-mono whitespace-nowrap">
                        <div className="font-bold text-title text-[11px]">{datePart}</div>
                        {timePart && (
                          <div className="text-[10px] text-subtitle opacity-75 mt-0.5">{timePart}</div>
                        )}
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
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase ${
                        log.status === 'SUCCESS' ? 'status-healthy' : log.status === 'WARNING' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'status-warning'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS FOOTER */}
        {!isLoading && filteredLogs.length > 0 && (
          <div className="p-4 border-t theme-border card-bg-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
            
            {/* Entry Summary & Page Size Selector */}
            <div className="flex items-center gap-4 text-subtitle">
              <span>
                Showing <b className="text-title">{startIndex + 1}</b> to <b className="text-title">{Math.min(startIndex + itemsPerPage, filteredLogs.length)}</b> of <b className="text-title">{filteredLogs.length}</b> logs
              </span>

              <div className="flex items-center gap-1.5">
                <span>Per Page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg card-bg-subtle text-title border theme-border font-bold focus:outline-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Page Navigation Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg card-bg-subtle text-title border theme-border font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-600 hover:text-white transition cursor-pointer"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg font-bold transition flex items-center justify-center cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'card-bg-subtle text-subtitle hover:text-title border theme-border'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg card-bg-subtle text-title border theme-border font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-600 hover:text-white transition cursor-pointer"
              >
                Next
              </button>
            </div>

          </div>
        )}
      </div>

    </motion.div>
  );
};
