import { create } from "zustand"
import { persist } from "zustand/middleware"

type Theme = "light" | "dark" | "system"

export const useThemeStore = create(
  persist<{ theme: Theme; setTheme: (theme: Theme) => void }>(
    (set) => ({
      theme: "light",
      setTheme: (theme) => set({ theme }),
    }),
    { name: "ui-theme" },
  ),
)
