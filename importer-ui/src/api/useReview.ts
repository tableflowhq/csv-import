import { useState } from "react";
import { useQuery, UseQueryResult } from "react-query";
import useIsStored from "./hooks/useIsStored";
import { ApiResponse, Import } from "./types";
import { get } from "./api";

export default function useReview(uploadId: string): UseQueryResult<Import> {
  const [configOverrides, setConfigOverrides] = useState({});

  const query: UseQueryResult<Import> = useQuery(
    ["upload", uploadId],
    () => {
      setRefetchCount((count) => count + 1);
      return uploadId ? getReview(uploadId) : {};
    },
    { keepPreviousData: true, ...configOverrides }
  );

  const { customError, setRefetchCount } = useIsStored(uploadId, setConfigOverrides, query?.data, query?.error);

  return customError ? ({ ...query, error: customError } as any) : query;
}

async function getReview(uploadId: string) {
  const response: ApiResponse<Import> = await get(`import/${uploadId}/review`);

  if (!response.ok) throw response.error;

  return response?.data;
}
