import { create } from "zustand";
import { persist } from "zustand/middleware";

type themeStoreType = {
  theme: "dark" | "light";
  toggleTheme: () => void;
};

const useThemeStore = create<themeStoreType>()(
  persist(
    (set) => ({
      theme: window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "light" ? "dark" : "light",
        })),
    }),
    {
      name: "theme",
    }
  )
);

export default useThemeStore;
