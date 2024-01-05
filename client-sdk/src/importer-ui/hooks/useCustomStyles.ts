import { useEffect } from "react";

export default function useCustomStyles(customStyles?: string) {
  useEffect(() => {
    if (customStyles) {
      const parsedStyles = JSON.parse(customStyles);
      if (parsedStyles) {
        Object.keys(parsedStyles).forEach((key) => {
          const root = document.documentElement;
          const value = parsedStyles?.[key as any];
          root.style.setProperty("--" + key, value);
        });
      }
    }
  }, [customStyles]);
}
