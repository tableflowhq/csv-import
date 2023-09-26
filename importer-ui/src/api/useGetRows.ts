import { useQuery, UseQueryResult } from "react-query";
import { ApiResponse, ImportRowResponse, QueryFilter } from "./types";
import { get } from "./api";

export const fetchRows = async (uploadId: string, filter: QueryFilter, limit: number, offset: number) => {
  const response: ApiResponse<ImportRowResponse> = await get(`import/${uploadId}/rows?filter=${filter}&limit=${limit}&offset=${offset}`);
  if (!response.ok) throw response.error;
  return response?.data;
};
export default function useGetRows(uploadId: string, filter: QueryFilter, limit: number, offset: number): UseQueryResult<ImportRowResponse> {
  const query = useQuery<ImportRowResponse, Error>(
    ["review-rows", uploadId, filter, limit, offset],
    () => fetchRows(uploadId, filter, limit, offset),
    {
      staleTime: 0, //TODO: only cache when it it not the first load
    }
  );

  return query;
}
