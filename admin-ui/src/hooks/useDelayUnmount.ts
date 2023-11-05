import { useEffect, useState } from "react";

export default function useDelayUnmount(isMounted: boolean, delayTime?: number): boolean {
  const [shouldRender, setShouldRender] = useState(false);

  const transitionsSpeed = 600;

  useEffect(() => {
    let timeoutId: any;
    if (isMounted && !shouldRender) {
      setShouldRender(true);
    } else if (!isMounted && shouldRender) {
      timeoutId = setTimeout(() => setShouldRender(false), delayTime || transitionsSpeed);
    }
    return () => clearTimeout(timeoutId);
  }, [isMounted, delayTime, shouldRender]);

  return shouldRender;
}
