import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { qcAuthApi } from '../api/auth';
import { setQcToken } from '../api/client';
import { clearQcSession, loadQcSession, saveQcSession } from './session';
import type { QcLoginDto, QcUser } from '../types';

type QcAuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface QcAuthContextValue {
  token: string | null;
  user: QcUser | null;
  status: QcAuthStatus;
  /** Autentica contra el backend QC, persiste y guarda el token. */
  login: (dto: QcLoginDto) => Promise<QcUser>;
  logout: () => void;
}

const QcAuthContext = createContext<QcAuthContextValue | null>(null);

export function QcAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<QcUser | null>(null);
  const [status, setStatus] = useState<QcAuthStatus>('loading');

  // Restaurar la sesión persistida al arrancar.
  useEffect(() => {
    loadQcSession()
      .then((session) => {
        if (session) {
          setToken(session.token);
          setUser(session.user);
          setQcToken(session.token);
          setStatus('authenticated');
        } else {
          setStatus('unauthenticated');
        }
      })
      .catch(() => setStatus('unauthenticated'));
  }, []);

  const login = useCallback(async (dto: QcLoginDto) => {
    const result = await qcAuthApi.login(dto);
    setToken(result.token);
    setUser(result.user);
    setQcToken(result.token);
    setStatus('authenticated');
    await saveQcSession(result.token, result.user).catch(() => {});
    return result.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setQcToken(null);
    setStatus('unauthenticated');
    clearQcSession().catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ token, user, status, login, logout }),
    [token, user, status, login, logout],
  );

  return <QcAuthContext.Provider value={value}>{children}</QcAuthContext.Provider>;
}

export function useQcAuthContext(): QcAuthContextValue {
  const ctx = useContext(QcAuthContext);
  if (!ctx) throw new Error('useQcAuthContext debe usarse dentro de <QcAuthProvider>');
  return ctx;
}
