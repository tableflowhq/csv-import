import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light";
type themeStoreType = {
  theme: Theme;
  setTheme: (theme?: Theme) => void;
};

const STORAGE_KEY = "csv-importer-theme";

const useThemeStore = create<themeStoreType>()(
  persist(
    (set) => ({
      theme: typeof window !== "undefined" ? (localStorage.getItem(STORAGE_KEY) as Theme) : "light",
      setTheme: (newTheme) =>
        set((state) => {
          const theme = newTheme || (state.theme === "light" ? "dark" : "light");
          return { theme };
        }),
    }),
    {
      name: STORAGE_KEY,
    }
  )
);

export default useThemeStore;
