import { useCallback, useLayoutEffect, useState } from "react";
import useEventListener from "./useEventListener";
import useIsomorphicLayoutEffect from "./useIsomorphicLayoutEffect";

type Size = {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
};

function useRect<T extends HTMLElement = HTMLDivElement>(): [(node: T | null) => void, Size, Function] {
  // Mutable values like 'ref.current' aren't valid dependencies
  // because mutating them doesn't re-render the component.
  // Instead, we use a state as a ref to be reactive.
  const [ref, setRef] = useState<T | null>(null);
  const [size, setSize] = useState<Size>({ x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 });

  // Prevent too many rendering using useCallback
  const updateRect = useCallback(() => {
    ref && setSize(ref.getBoundingClientRect());
  }, [ref?.offsetHeight, ref?.offsetWidth]);

  useEventListener("resize", updateRect);

  useIsomorphicLayoutEffect(() => {
    updateRect();
  }, [ref?.offsetHeight, ref?.offsetWidth]);

  useLayoutEffect(() => {
    window.addEventListener("mresize", updateRect);

    return () => window.removeEventListener("mresize", updateRect);
  }, []);

  return [setRef, size, updateRect];
}

export default useRect;
