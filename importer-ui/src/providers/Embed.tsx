import { useEffect } from "react";
import { useThemeStore } from "@tableflow/ui-library";
import useSearchParams from "../hooks/useSearchParams";
import useEmbedStore from "../stores/embed";
import { EmbedProps } from "./types";

export default function Embed({ children }: EmbedProps) {
  const { importerId, darkMode: darkModeString, primaryColor, metadata, isOpen, onComplete, customStyles } = useSearchParams();

  // Set importerId & metadata in embed store
  const setEmbedParams = useEmbedStore((state) => state.setEmbedParams);
  useEffect(() => {
    setEmbedParams({
      importerId,
      metadata,
      isOpen: isOpen !== "false" && isOpen !== "0",
      onComplete: !!onComplete && onComplete !== "false" && onComplete !== "0",
    });
  }, [importerId, metadata]);

  // Set Light/Dark mode
  const darkMode = darkModeString === "true";
  const setTheme = useThemeStore((state) => state.setTheme);

  useEffect(() => {
    setTheme(darkMode ? "dark" : "light");
  }, [darkMode]);

  // Set primary color
  useEffect(() => {
    if (primaryColor) {
      const root = document.documentElement;
      root.style.setProperty("--color-primary", primaryColor);
    }
  }, [primaryColor]);

  useEffect(() => {
    try {
      const parsedStyles = customStyles && JSON.parse(customStyles);

      customStyles &&
        Object.keys(parsedStyles).forEach((key) => {
          const root = document.documentElement;
          const value = parsedStyles?.[key as any];
          root.style.setProperty("--" + key, value);
        });
    } catch (e) {
      console.error('The "customStyles" prop is not a valid JSON string. Please check the documentation for more details.');
    }
  }, [customStyles]);

  return <>{children}</>;
}
