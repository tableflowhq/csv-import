import { useEffect, useState } from "react";
import { useQuery, UseQueryResult } from "react-query";
import { ApiResponse, Upload } from "./types";
import { get } from "./api";

const config = { keepPreviousData: true };

export default function useGetUpload(tusId: string): UseQueryResult<Upload> {
  const [configOverrides, setConfigOverrides] = useState({});
  const [refetchCount, setRefetchCount] = useState(0);
  const [customError, setCustomError] = useState("");

  const query: UseQueryResult<Upload> = useQuery(
    ["upload", tusId],
    () => {
      setRefetchCount((count) => count + 1);
      return tusId ? getUpload(tusId) : {};
    },
    { ...config, ...configOverrides }
  );
  const isParsed = query?.data?.is_parsed;
  const { error } = query;

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
    if (isParsed) {
      setConfigOverrides({ enabled: false });
    } else if (tusId && !error) {
      if (refetchCount <= maxRefetchCount) {
        setConfigOverrides({ refetchInterval: waitDelay(refetchCount), enabled: true });
      } else {
        setConfigOverrides({ enabled: false });
        setCustomError("The upload could not be processed. Please try again.");
      }
    } else {
      setConfigOverrides({ enabled: true });
    }
  }, [isParsed, tusId, error, refetchCount]);

  return customError ? ({ ...query, error: customError } as any) : query;
}

async function getUpload(tusId: string) {
  const response: ApiResponse<Upload> = await get(`upload/${tusId}`, true);

  if (!response.ok) throw response.error;

  return response.data;
}
