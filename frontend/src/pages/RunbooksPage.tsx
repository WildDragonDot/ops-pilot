import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Play, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Terminal, 
  Database, 
  Cpu, 
  HardDrive, 
  RefreshCw, 
  Zap,
  Sliders,
  AlertTriangle
} from 'lucide-react';

interface Runbook {
  id: string;
  title: string;
  category: 'Database' | 'Cache' | 'Security' | 'Infrastructure' | 'Performance';
  description: string;
  estimatedDuration: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  targetService: string;
  steps: string[];
  lastExecuted?: string;
  successRate: string;
}

export const RunbooksPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [runningId, setRunningId] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, string[]>>({});
  const [executedSet, setExecutedSet] = useState<Set<string>>(new Set());

  const runbooks: Runbook[] = [
    {
      id: 'rb-pg-vacuum',
      title: 'PostgreSQL DB Index Optimization & Vacuum',
      category: 'Database',
      description: 'Reclaim dead tuple storage, analyze tables, and rebuild indexes for optimized query latency.',
      estimatedDuration: '45s',
      riskLevel: 'LOW',
      targetService: 'PostgreSQL 15 (postgres_db)',
      steps: [
        'Connect to postgres container via psql',
        'Execute VACUUM ANALYZE VERBOSE on high-traffic tables',
        'Reindex bloated primary key indexes',
        'Verify database connection pool latency'
      ],
      lastExecuted: '2 hours ago',
      successRate: '99.4%'
    },
    {
      id: 'rb-redis-purge',
      title: 'Redis Memory Defragmentation & Cache Flush',
      category: 'Cache',
      description: 'Clear expired session cache keys and execute memory defragmentation on Redis cluster.',
      estimatedDuration: '15s',
      riskLevel: 'LOW',
      targetService: 'Redis 7 (redis_cache)',
      steps: [
        'Issue MEMORY DOCTOR diagnostic check',
        'Purge stale cache keys matching session:* pattern',
        'Trigger MEMORY PURGE background allocation release',
        'Verify cache hit ratio recovery'
      ],
      lastExecuted: '1 day ago',
      successRate: '100%'
    },
    {
      id: 'rb-nginx-tune',
      title: 'Nginx Rate Limit & Connection Pool Tuning',
      category: 'Infrastructure',
      description: 'Adjust max keepalive connections and apply DDoS rate-limiting rules to reverse proxy.',
      estimatedDuration: '30s',
      riskLevel: 'MEDIUM',
      targetService: 'Nginx Proxy (nginx_gateway)',
      steps: [
        'Validate nginx.conf syntax via nginx -t',
        'Reload worker connections config dynamically',
        'Apply burst limit 50 r/s on auth endpoints',
        'Verify SSL handshake performance'
      ],
      lastExecuted: '3 days ago',
      successRate: '98.1%'
    },
    {
      id: 'rb-heap-dump',
      title: 'Node.js V8 Memory Heap Profiler & Dump',
      category: 'Performance',
      description: 'Capture active Node.js heap snapshot to detect memory leak references without downtime.',
      estimatedDuration: '20s',
      riskLevel: 'LOW',
      targetService: 'Node.js API (api_server)',
      steps: [
        'Trigger SIGUSR2 heap snapshot signal on API master PID',
        'Store snapshot artifact in /var/log/opspilot/dumps',
        'Analyze GC allocation bottlenecks',
        'Verify process RSS memory stability'
      ],
      lastExecuted: '5 hours ago',
      successRate: '96.8%'
    },
    {
      id: 'rb-ssl-renew',
      title: 'Automated TLS/SSL Certificate Renewal',
      category: 'Security',
      description: 'Check Let\'s Encrypt certificate expiry and auto-renew TLS keys before downtime.',
      estimatedDuration: '60s',
      riskLevel: 'MEDIUM',
      targetService: 'Certbot / OpenSSL Key Vault',
      steps: [
        'Check x509 expiration date on domain endpoints',
        'Request ACME challenge validation',
        'Write new cert pem bundle to /etc/ssl/live',
        'Gracefully reload Nginx ingress controller'
      ],
      lastExecuted: '4 days ago',
      successRate: '100%'
    }
  ];

  const filteredRunbooks = selectedCategory === 'ALL'
    ? runbooks
    : runbooks.filter(r => r.category === selectedCategory);

  const handleExecuteRunbook = (rb: Runbook) => {
    setRunningId(rb.id);
    setLogs(prev => ({ ...prev, [rb.id]: [`[${new Date().toLocaleTimeString()}] Initializing ${rb.title}...`] }));

    rb.steps.forEach((step, idx) => {
      setTimeout(() => {
        setLogs(prev => ({
          ...prev,
          [rb.id]: [...(prev[rb.id] || []), `[${new Date().toLocaleTimeString()}] Step ${idx + 1}/${rb.steps.length}: ${step} ✓`]
        }));
      }, (idx + 1) * 1000);
    });

    setTimeout(() => {
      setLogs(prev => ({
        ...prev,
        [rb.id]: [...(prev[rb.id] || []), `[${new Date().toLocaleTimeString()}] ✅ Runbook completed successfully in ${rb.estimatedDuration}.`]
      }));
      setRunningId(null);
      setExecutedSet(prev => new Set(prev).add(rb.id));
    }, (rb.steps.length + 1) * 1000);
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
              OpsPilot Automated Workflows
            </span>
          </div>
          <h1 className="text-2xl font-bold text-title tracking-tight">Runbook Automation Engine</h1>
          <p className="text-xs text-subtitle max-w-2xl leading-relaxed">
            One-click automated operational runbooks for database optimization, cache defragmentation, proxy tuning, and memory profiling.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'Database', 'Cache', 'Infrastructure', 'Security'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
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

      {/* Runbooks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredRunbooks.map((rb) => {
          const isRunning = runningId === rb.id;
          const isDone = executedSet.has(rb.id);
          const currentLogs = logs[rb.id] || [];

          return (
            <div 
              key={rb.id}
              className="glass-panel p-6 rounded-2xl theme-border border space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold card-bg-subtle text-subtitle border theme-border">
                    {rb.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-subtitle flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {rb.estimatedDuration}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      rb.riskLevel === 'LOW' ? 'status-healthy' : 'status-warning'
                    }`}>
                      {rb.riskLevel} RISK
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-title">{rb.title}</h3>
                  <p className="text-xs text-subtitle mt-1 leading-relaxed">{rb.description}</p>
                </div>

                <div className="p-3 rounded-xl card-bg-subtle border theme-border space-y-1.5">
                  <div className="text-[11px] font-bold text-title flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-500" />
                    <span>Target: {rb.targetService}</span>
                  </div>
                  <div className="space-y-1 text-[11px] font-mono text-subtitle">
                    {rb.steps.map((st, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="text-blue-500 shrink-0">{i + 1}.</span>
                        <span>{st}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {currentLogs.length > 0 && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-emerald-400 font-mono text-[11px] space-y-1 max-h-36 overflow-y-auto">
                    {currentLogs.map((l, i) => (
                      <div key={i}>{l}</div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t theme-border flex items-center justify-between gap-4">
                <div className="text-[10px] font-mono text-subtitle">
                  Success Rate: <b className="text-emerald-600 dark:text-emerald-400">{rb.successRate}</b>
                </div>

                <button
                  onClick={() => handleExecuteRunbook(rb)}
                  disabled={isRunning}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl shadow-sm transition ${
                    isDone 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Executing...</span>
                    </>
                  ) : isDone ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completed</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Execute Runbook</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </motion.div>
  );
};
