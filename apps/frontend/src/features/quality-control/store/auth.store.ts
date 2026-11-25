import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QcUser } from "../types";

interface QcAuthState {
  token: string | null;
  user: QcUser | null;
  setAuth: (token: string, user: QcUser) => void;
  updateUser: (user: QcUser) => void;
  logout: () => void;
}

/**
 * Store de autenticación del módulo Quality Control.
 *
 * El módulo es 100% autocontenido (todas las rutas viven bajo /api/quality-control
 * y usan su propio JWT firmado con QC_JWT_SECRET), así que NO espeja el token a
 * localStorage["token"] como hace el módulo PM (que necesitaba convivir con los
 * endpoints legacy del ERP).
 */
export const useQcAuthStore = create<QcAuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        set({ token, user });
      },
      updateUser: (user) => {
        set({ user });
      },
      logout: () => {
        set({ token: null, user: null });
      },
    }),
    {
      name: "qc-auth-storage",
    }
  )
);
