import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — React class component that catches unhandled render errors.
 * 
 * Usage:
 *   <ErrorBoundary>
 *     <MyPage />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught render error:', error, info.componentStack);
    if (error?.message && error.message.includes('Failed to fetch dynamically imported module')) {
      const storageKey = 'vite_hmr_reload_attempt';
      const lastAttempt = sessionStorage.getItem(storageKey);
      if (!lastAttempt) {
        sessionStorage.setItem(storageKey, String(Date.now()));
        window.location.reload();
      }
    }
  }

  handleReset = () => {
    sessionStorage.removeItem('vite_hmr_reload_attempt');
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
            fontFamily: "'Inter', system-ui, sans-serif",
            padding: '24px'
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              padding: '40px 36px',
              textAlign: 'center',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
            }}
          >
            {/* Icon */}
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>

            <h1
              style={{
                color: '#f0f6fc',
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 8,
                margin: '0 0 8px'
              }}
            >
              Something went wrong
            </h1>

            <p
              style={{
                color: '#8b949e',
                fontSize: 13,
                lineHeight: 1.6,
                margin: '0 0 24px'
              }}
            >
              An unexpected error occurred in D-OpsPilot AI. This has been logged
              automatically.
            </p>

            {/* Error details (dev only) */}
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <pre
                style={{
                  background: 'rgba(248,81,73,0.08)',
                  border: '1px solid rgba(248,81,73,0.2)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  fontSize: 11,
                  color: '#f85149',
                  textAlign: 'left',
                  overflowX: 'auto',
                  marginBottom: 24,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {this.state.error.message}
              </pre>
            )}

            <button
              onClick={this.handleReset}
              style={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '10px 28px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '0.02em',
                transition: 'opacity 0.2s'
              }}
              onMouseOver={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseOut={e => (e.currentTarget.style.opacity = '1')}
            >
              ↩ Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * RouteErrorBoundary — lightweight boundary for wrapping individual routes.
 * Shows a compact inline error instead of a full-screen fallback.
 */
export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[RouteErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-12">
          <div className="text-center space-y-3">
            <div className="text-3xl">⚡</div>
            <p className="text-sm font-semibold text-rose-400">Page failed to load</p>
            <p className="text-xs text-slate-500">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="text-xs text-blue-400 hover:underline cursor-pointer"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
