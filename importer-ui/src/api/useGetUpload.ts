import { useEffect, useState } from "react";
import { useQuery, UseQueryResult } from "react-query";
import { ApiResponse, Upload } from "./types";
import { get } from "./api";

const config = { keepPreviousData: true };

export default function useGetUpload(tusId: string): UseQueryResult<Upload> {
  const [configOverrides, setConfigOverrides] = useState({});
  const [refetchCount, setRefetchCount] = useState(0);

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

  // TODO: Add the ability to re-upload if there is an error here
  useEffect(() => {
    if (isParsed) {
      setConfigOverrides({ enabled: false });
    } else if (tusId && !error) {
      // TODO: Show an error if this reaches the max refetch count
      // "The upload could not be processed. Please try again."
      if (refetchCount <= 25) setConfigOverrides({ refetchInterval: 200, enabled: true });
      else setConfigOverrides({ enabled: false });
    } else {
      setConfigOverrides({ enabled: true });
    }
  }, [isParsed, tusId, error, refetchCount]);

  return query;
}

async function getUpload(tusId: string) {
  const response: ApiResponse<Upload> = await get(`upload/${tusId}`, true);

  if (!response.ok) throw response.error;

  return response.data;
}
