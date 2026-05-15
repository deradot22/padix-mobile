import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, loadToken, setToken } from '../api/client';
import type { MeResponse } from '../api/types';

type AuthState = {
  loading: boolean;
  user: MeResponse | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<MeResponse | null>(null);

  useEffect(() => {
    (async () => {
      const token = await loadToken();
      if (token) {
        try {
          const me = await api.me();
          setUser(me);
        } catch {
          await setToken(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    await setToken(res.token);
    const me = await api.me();
    setUser(me);
  };

  const logout = async () => {
    await setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const me = await api.me();
      setUser(me);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ loading, user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
