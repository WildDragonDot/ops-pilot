import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X, Bell } from 'lucide-react';
import { fetchNotifications, persistNotification, markNotificationRead, markAllNotificationsRead, deleteNotificationApi, clearAllNotificationsApi } from '../services/api';
import { useAuth } from './AuthContext';

export interface ToastNotification {
  id: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  timestamp?: string;
  read?: boolean;
  persisted?: boolean; // true if stored in DB
  hideToast?: boolean; // true to hide from floating toast
}

interface NotificationContextType {
  notifications: ToastNotification[];
  unreadCount: number;
  addNotification: (toast: Omit<ToastNotification, 'id'>) => void;
  removeNotification: (id: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const loadedRef = useRef(false);

  // Load persisted notifications from DB on mount / login
  useEffect(() => {
    if (!token || loadedRef.current) return;
    loadedRef.current = true;

    fetchNotifications({ limit: 20 })
      .then(data => {
        if (data?.notifications?.length > 0) {
          const persisted: ToastNotification[] = data.notifications.map((n: any) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            timestamp: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: n.read,
            persisted: true,
            hideToast: true
          }));
          setNotifications(persisted);
          setUnreadCount(data.unreadCount || 0);
        }
      })
      .catch(() => {
        // Silently fail — app works without persistence
      });
  }, [token]);

  const addNotification = useCallback((toast: Omit<ToastNotification, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastNotification = {
      ...toast,
      id,
      read: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setNotifications(prev => [newToast, ...prev.slice(0, 19)]);
    setUnreadCount(c => c + 1);

    // Persist to DB if authenticated (fire-and-forget)
    if (token) {
      persistNotification({ type: toast.type, title: toast.title, message: toast.message })
        .then(result => {
          if (result?.notification) {
            // Replace temp ID with real DB id
            setNotifications(prev =>
              prev.map(n => n.id === id ? { ...n, id: result.notification.id, persisted: true } : n)
            );
          }
        })
        .catch(() => {});
    }

    // Auto-dismiss in-memory toast after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, hideToast: true } : n));
    }, 5000);
  }, [token]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const n = prev.find(n => n.id === id);
      // If persisted, delete from DB too
      if (n?.persisted && token) {
        deleteNotificationApi(id).catch(() => {});
      }
      return prev.filter(n => n.id !== id);
    });
  }, [token]);

  const markRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(c => Math.max(0, c - 1));
    if (token) {
      markNotificationRead(id).catch(() => {});
    }
  }, [token]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    if (token) {
      markAllNotificationsRead().catch(() => {});
    }
  }, [token]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    if (token) {
      clearAllNotificationsApi().catch(() => {});
    }
  }, [token]);

  // Listen to live SSE events from backend with exponential backoff reconnect
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryCount = 0;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    const MAX_RETRIES = 5;
    const BASE_DELAY_MS = 2000;

    function connect() {
      if (retryCount >= MAX_RETRIES) return; // Give up after 5 attempts
      try {
        eventSource = new EventSource('/api/stream/events');

        eventSource.onopen = () => {
          retryCount = 0; // Reset retry count on successful connection
        };

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
          } catch {
            // Malformed SSE message — ignore silently
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Exponential backoff reconnect
          const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retryCount), 30_000);
          retryCount++;
          retryTimeout = setTimeout(connect, delay);
        };
      } catch {
        // SSE not supported or network unavailable — do not retry
      }
    }

    connect();

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      if (eventSource) eventSource.close();
    };
  }, [addNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, removeNotification, markRead, markAllRead, clearAll }}>
      {children}

      {/* Floating Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none font-sans">
        {notifications.filter(n => !n.read && !n.hideToast).slice(0, 5).map(n => (
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
                <div className="flex items-center gap-1 shrink-0">
                  {n.persisted && <Bell className="w-2.5 h-2.5 text-slate-400" aria-label="Saved" />}
                  {n.timestamp && <span className="text-[9px] font-mono text-slate-400">{n.timestamp}</span>}
                </div>
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
