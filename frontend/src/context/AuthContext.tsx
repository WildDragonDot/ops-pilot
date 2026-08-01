import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  provider?: string;
  avatarUrl?: string;
  organizationId: string;
  organizationName: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const sanitizeUser = (u: User | null): User | null => {
  if (!u) return null;
  if (!u.organizationName || u.organizationName === 'Acme Operations Corp' || u.organizationName === 'acme-corp') {
    return { ...u, organizationName: 'OpsPilot Production Org' };
  }
  return u;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('opspilot_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('opspilot_user');
    return saved ? sanitizeUser(JSON.parse(saved)) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (token) {
      // Use the centralized apiFetch pattern directly to get proper 401 handling
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15_000)
      })
        .then(async res => {
          if (res.status === 401 || res.status === 403) {
            logout();
            return;
          }
          if (!res.ok) {
            // Non-auth error (e.g. 500) — keep existing cached user, don't force logout
            return;
          }
          const data = await res.json();
          if (data.user) {
            const clean = sanitizeUser(data.user)!;
            setUser(clean);
            localStorage.setItem('opspilot_user', JSON.stringify(clean));
          } else {
            logout();
          }
        })
        .catch(() => {
          // Network error — keep cached user so app works offline
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    const clean = sanitizeUser(newUser)!;
    setToken(newToken);
    setUser(clean);
    localStorage.setItem('opspilot_token', newToken);
    localStorage.setItem('opspilot_user', JSON.stringify(clean));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('opspilot_token');
    localStorage.removeItem('opspilot_user');
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
