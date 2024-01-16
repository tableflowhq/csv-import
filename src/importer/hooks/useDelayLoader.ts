import { useEffect, useState } from "react";

const useDelayedLoader = (isLoading: boolean, delay: number): boolean => {
  const [showLoader, setShowLoader] = useState<boolean>(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (isLoading) {
      timer = setTimeout(() => {
        setShowLoader(true);
      }, delay);
    } else {
      setShowLoader(false);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [isLoading, delay]);

  return showLoader;
};

export default useDelayedLoader;
