import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserScopes {
  processes: string[];
  subprocesses: string[];
  projects: string[];
}

export interface User {
  id: string;
  email: string;
  roles: string[];
  permissions?: string[];
  scopes?: UserScopes;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  updateUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      updateUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'executive-auth-storage',
    },
  ),
);
