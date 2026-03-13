import { create } from "zustand";
import { persist } from "zustand/middleware";

import api from "../api/axios";

interface ThemeStore {
  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: "light",

      toggleTheme: () => {
        const next = get().theme === "light" ? "dark" : "light";
        set({ theme: next });
        api.patch("/users/preferences", { theme: next }).catch(() => {});
      },

      setTheme: (theme) => {
        set({ theme });
        api.patch("/users/preferences", { theme }).catch(() => {});
      },
    }),
    { name: "theme" },
  ),
);
