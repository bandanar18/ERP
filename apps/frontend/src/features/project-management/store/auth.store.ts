import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PmUser } from '../types';

interface PmAuthState {
  token: string | null;
  user: PmUser | null;
  setAuth: (token: string, user: PmUser) => void;
  updateUser: (user: PmUser) => void;
  logout: () => void;
}

/**
 * Store de autenticación del módulo Project Management.
 *
 * Además de persistir en `pm-auth-storage`, espeja el token en
 * `localStorage["token"]` / `localStorage["user"]` para que los services
 * de datos que usan `fetchWithRefresh` (endpoints legacy /api/projects,
 * /api/companies, etc.) envíen el token del módulo, aceptado por el
 * backend a través del fallback PM_JWT_SECRET en el auth middleware.
 */
export const usePmAuthStore = create<PmAuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        set({ token, user });
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
      },
      updateUser: (user) => {
        set({ user });
        localStorage.setItem("user", JSON.stringify(user));
      },
      logout: () => {
        set({ token: null, user: null });
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("refreshToken");
      },
    }),
    {
      name: 'pm-auth-storage',
    }
  )
);
