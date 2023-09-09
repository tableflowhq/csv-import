import { useState } from "react";
import { useQuery, UseQueryResult } from "react-query";
import useIsStored from "./hooks/useIsStored";
import { ApiResponse, Import } from "./types";
import { get } from "./api";

type Pagination = {
  total: number;
  offset: number;
  limit: number;
};

export default function useGetImport(uploadId: string, initialLimit = 2): UseQueryResult<Import> {
  const [configOverrides, setConfigOverrides] = useState({});
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    offset: 0,
    limit: initialLimit,
  });

  const queryKey = ["upload", uploadId, pagination.offset, pagination.limit];

  const query: UseQueryResult<Import> = useQuery(
    queryKey,
    () => {
      return uploadId ? getImport(uploadId, pagination.offset, pagination.limit) : {};
    },
    {
      keepPreviousData: true,
      ...configOverrides,
    }
  );

  const { customError, setRefetchCount } = useIsStored(uploadId, setConfigOverrides, query?.data, query?.error);

  const loadMore = () => {
    const nextOffset = pagination.offset + pagination.limit;

    if (nextOffset < pagination.total) {
      setPagination({ ...pagination, offset: nextOffset });
    }
  };

  return customError ? ({ ...query, error: customError } as any) : { ...query, loadMore };
}

async function getImport(uploadId: string, offset: number, limit: number) {
  const response: ApiResponse<Import> = await get(`import/${uploadId}/rows?offset=${offset}&limit=${limit}`);

  if (!response.ok) throw response.error;

  return response?.data;
}
