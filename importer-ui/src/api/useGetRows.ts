import { useInfiniteQuery, UseInfiniteQueryResult } from "react-query";
import { ApiResponse, ImportRowResponse, QueryFilter } from "./types";
import { get } from "./api";

export default function useGetRows(uploadId: string, filter: QueryFilter, limit: number, offset: number): UseInfiniteQueryResult<ImportRowResponse> {
  const fetchRows = async ({ pageParam = offset }) => {
    const response: ApiResponse<ImportRowResponse> = await get(`import/${uploadId}/rows?filter=${filter}&limit=${limit}&offset=${pageParam}`);
    if (!response.ok) throw response.error;
    return response?.data;
  };

  const query = useInfiniteQuery<ImportRowResponse, Error>({
    queryKey: ["review-rows", uploadId, filter, limit],
    queryFn: fetchRows,
    getNextPageParam: (lastPage) => lastPage?.pagination?.offset,
  });

  return query;
}
