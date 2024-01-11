import { useCallback, useEffect } from "react";

export default function useClickOutside(ref: any | null, callback: (...args: any[]) => any): void {
  const staticCallback = useCallback(callback, []);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (ref && ref?.current && !ref.current.contains(event.target)) staticCallback(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, staticCallback]);
}
