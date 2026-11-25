import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { pmAuthApi } from '../api/auth';
import { projectService } from '../api/projects';
import { setPmToken } from '../api/client';
import { clearSession, loadSession, saveSession } from './session';
import type { LoginDto, PmUser } from '../types';

type PmAuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface PmAuthContextValue {
  token: string | null;
  user: PmUser | null;
  status: PmAuthStatus;
  /** Autentica contra el backend, persiste y guarda el token. */
  login: (dto: LoginDto, remember?: boolean) => Promise<PmUser>;
  logout: () => void;
}

const PmAuthContext = createContext<PmAuthContextValue | null>(null);

export function PmAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<PmUser | null>(null);
  const [status, setStatus] = useState<PmAuthStatus>('loading');

  // Restaurar la sesión persistida al arrancar.
  useEffect(() => {
    loadSession()
      .then((session) => {
        if (session) {
          setToken(session.token);
          setUser(session.user);
          setPmToken(session.token);
          setStatus('authenticated');
        } else {
          setStatus('unauthenticated');
        }
      })
      .catch(() => setStatus('unauthenticated'));
  }, []);

  const login = useCallback(async (dto: LoginDto, remember: boolean = false) => {
    const result = await pmAuthApi.login(dto);
    setToken(result.token);
    setUser(result.user);
    setPmToken(result.token);
    setStatus('authenticated');
    if (remember) {
      await saveSession(result.token, result.user).catch(() => {});
    } else {
      await clearSession().catch(() => {});
    }
    return result.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setPmToken(null);
    setStatus('unauthenticated');
    clearSession().catch(() => {});
    projectService.clearCache();
  }, []);

  const value = useMemo(
    () => ({ token, user, status, login, logout }),
    [token, user, status, login, logout],
  );

  return <PmAuthContext.Provider value={value}>{children}</PmAuthContext.Provider>;
}

export function usePmAuthContext(): PmAuthContextValue {
  const ctx = useContext(PmAuthContext);
  if (!ctx) throw new Error('usePmAuthContext debe usarse dentro de <PmAuthProvider>');
  return ctx;
}
