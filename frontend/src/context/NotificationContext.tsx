import React, { createContext, useContext, useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface ToastNotification {
  id: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  timestamp?: string;
}

interface NotificationContextType {
  notifications: ToastNotification[];
  addNotification: (toast: Omit<ToastNotification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addNotification = (toast: Omit<ToastNotification, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastNotification = {
      ...toast,
      id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setNotifications(prev => [newToast, ...prev.slice(0, 4)]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Listen to live SSE events from backend if available
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/stream/events');
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.title && data.message) {
            addNotification({
              type: data.type || 'info',
              title: data.title,
              message: data.message
            });
          }
        } catch (e) {
          // Parse fail
        }
      };
    } catch (err) {
      // SSE unsupported fallback
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll }}>
      {children}
      
      {/* Floating Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none font-sans">
        {notifications.map(n => (
          <div
            key={n.id}
            className={`pointer-events-auto p-3.5 rounded-xl border shadow-xl flex items-start gap-3 transition-all duration-300 transform translate-y-0 backdrop-blur-md ${
              n.type === 'success' ? 'bg-white dark:bg-[#0d1117] border-emerald-500/40 text-slate-900 dark:text-slate-100 shadow-emerald-500/10' :
              n.type === 'danger' ? 'bg-white dark:bg-[#0d1117] border-rose-500/40 text-slate-900 dark:text-slate-100 shadow-rose-500/10' :
              n.type === 'warning' ? 'bg-white dark:bg-[#0d1117] border-amber-500/40 text-slate-900 dark:text-slate-100 shadow-amber-500/10' :
              'bg-white dark:bg-[#0d1117] border-blue-500/40 text-slate-900 dark:text-slate-100 shadow-blue-500/10'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {n.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              {n.type === 'danger' && <XCircle className="w-5 h-5 text-rose-500" />}
              {n.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
              {n.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
            </div>

            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold truncate leading-snug">{n.title}</h4>
                {n.timestamp && <span className="text-[9px] font-mono text-slate-400 shrink-0">{n.timestamp}</span>}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">
                {n.message}
              </p>
            </div>

            <button
              onClick={() => removeNotification(n.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
