import { useEffect, useState } from "react";

export default function useIsStored(queryId: string, setConfigOverrides: React.Dispatch<React.SetStateAction<{}>>, data: any, error: any) {
  const [refetchCount, setRefetchCount] = useState(0);
  const [customError, setCustomError] = useState("");

  const isStored = data?.is_stored || false;

  // TODO: Make this smarter based on file size
  const maxRefetchCount = 120;
  const waitDelay = (attempt: number) => {
    if (attempt <= 2) {
      return 100;
    }
    if (attempt <= 5) {
      return 250;
    }
    if (attempt <= 15) {
      return 500;
    }
    return 1000;
  };

  useEffect(() => {
    if (isStored) {
      setConfigOverrides({ enabled: false });
    } else if (queryId && !error) {
      if (refetchCount <= maxRefetchCount) {
        setConfigOverrides({ refetchInterval: waitDelay(refetchCount), enabled: true });
      } else {
        setConfigOverrides({ enabled: false });
        setCustomError("The upload could not be processed. Please try again.");
      }
    } else {
      setConfigOverrides({ enabled: true });
    }
  }, [isStored, queryId, error, refetchCount]);

  return { customError, setRefetchCount };
}
