'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Account, auth } from '@/lib/auth';

type AuthState = {
  account: Account | null;
  status: 'loading' | 'ready';
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [status, setStatus] = useState<AuthState['status']>('loading');

  useEffect(() => {
    auth
      .getSession()
      .then(setAccount)
      .catch(() => setAccount(null))
      .finally(() => setStatus('ready'));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setAccount(await auth.signIn(email, password));
  }, []);
  const signUp = useCallback(async (name: string, email: string, password: string) => {
    setAccount(await auth.signUp(name, email, password));
  }, []);
  const signOut = useCallback(async () => {
    await auth.signOut();
    setAccount(null);
  }, []);

  const value = useMemo(() => ({ account, status, signIn, signUp, signOut }), [account, status, signIn, signUp, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return ctx;
}
