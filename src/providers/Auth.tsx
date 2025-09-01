'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

const ORCHESTRATOR_PUBLIC_LANGSMITH_API_KEY =
  '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';

interface AuthSession {
  accessToken: string;
}

interface AuthContextType {
  session: AuthSession | null;
}

const AuthContext = createContext<AuthContextType>({ session: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    // Initialize with a default token or implement your auth logic
    setSession({
      accessToken: ORCHESTRATOR_PUBLIC_LANGSMITH_API_KEY || 'demo-token',
    });
  }, []);

  return (
    <AuthContext.Provider value={{ session }}>{children}</AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);
