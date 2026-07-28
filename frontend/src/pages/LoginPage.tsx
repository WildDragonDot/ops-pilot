import React, { useState } from 'react';
import { Cpu, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState<string>('admin@opspilot.ai');
  const [password, setPassword] = useState<string>('password123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail('admin@opspilot.ai');
    setPassword('password123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="max-w-md w-full glass-panel p-8 rounded-2xl border theme-border space-y-6 relative z-10 shadow-xl">
        
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-600 dark:text-blue-400 mb-2">
            <Cpu className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold text-title tracking-tight">OpsPilot AI</h1>
          <p className="text-xs text-subtitle">Autonomous DevOps Failure Commander & GitHub Intelligence Agent</p>
        </div>

        {/* Demo Account Filler Banner */}
        <div className="card-bg-subtle p-3 rounded-xl border theme-border flex items-center justify-between text-xs">
          <div>
            <span className="text-blue-600 dark:text-blue-400 font-semibold block">Demo Admin Account</span>
            <span className="text-subtitle text-[11px]">admin@opspilot.ai / password123</span>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-mono text-[10px] font-bold transition"
          >
            Fill Demo
          </button>
        </div>

        {error && (
          <div className="p-3 status-danger text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-title block">Email Address</label>
            <div className="flex items-center gap-2 theme-input px-3 py-2.5 rounded-xl border theme-border transition">
              <Mail className="w-4 h-4 text-subtitle shrink-0" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-transparent border-none text-xs text-title focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-title block">Password</label>
            <div className="flex items-center gap-2 theme-input px-3 py-2.5 rounded-xl border theme-border transition">
              <Lock className="w-4 h-4 text-subtitle shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent border-none text-xs text-title focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-subtitle hover:text-title p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In to Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t theme-border text-xs text-subtitle">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
          >
            Create Organization Workspace
          </button>
        </div>

      </div>
    </div>
  );
};
