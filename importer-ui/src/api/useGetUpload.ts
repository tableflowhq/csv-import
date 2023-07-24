import { useState } from "react";
import { useQuery, UseQueryResult } from "react-query";
import useIsParsed from "./hooks/useIsParsed";
import { ApiResponse, Upload } from "./types";
import { get } from "./api";

const config = { keepPreviousData: true };

export default function useGetUpload(tusId: string): UseQueryResult<Upload> {
  const [configOverrides, setConfigOverrides] = useState({});

  const query: UseQueryResult<Upload> = useQuery(
    ["upload", tusId],
    () => {
      setRefetchCount((count) => count + 1);
      return tusId ? getUpload(tusId) : {};
    },
    { ...config, ...configOverrides }
  );

  const { customError, setRefetchCount } = useIsParsed(tusId, setConfigOverrides, query?.data, query?.error);

  return customError ? ({ ...query, error: customError } as any) : query;
}

async function getUpload(tusId: string) {
  const response: ApiResponse<Upload> = await get(`upload/${tusId}`, true);

  if (!response.ok) throw response.error;

  return response.data;
}
