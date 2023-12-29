import { useState } from "react";
import { useQuery, UseQueryResult } from "react-query";
import useIsStored from "./hooks/useIsStored";
import { ApiResponse, Import } from "./types";
import { get } from "./api";

export default function useReview(uploadId: string, enabled: boolean, config?: any): UseQueryResult<Import> {
  const [configOverrides, setConfigOverrides] = useState({});

  const queryConfig = { ...configOverrides, ...config, ...(!enabled ? { enabled } : { enabled }) };

  const query: UseQueryResult<Import> = useQuery(
    ["review", uploadId],
    () => {
      setRefetchCount((count) => count + 1);
      if (!enabled) {
        return {} as any;
        // throw new Error("uploadId is required");
      }
      return getReview(uploadId);
    },
    { keepPreviousData: true, ...queryConfig }
  );

  const { customError, setRefetchCount } = useIsStored(uploadId, setConfigOverrides, query?.data, query?.error);

  return customError ? ({ ...query, error: customError } as any) : query;
}

async function getReview(uploadId: string): Promise<Import> {
  const response: ApiResponse<Import> = await get(`import/${uploadId}/review`);

  if (!response.ok) throw response.error;

  return response?.data;
}
