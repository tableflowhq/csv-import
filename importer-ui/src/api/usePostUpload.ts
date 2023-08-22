import { useMutation, UseMutationResult } from "react-query";
import { ApiResponse } from "./types";
import { post } from "./api";

type ColumnMap = { [key: string]: string };

export default function usePostUpload(uploadId: string): UseMutationResult<ApiResponse<any>> {
  return useMutation((columns: any) => mutateColumnMap(uploadId, columns));
}

async function mutateColumnMap(uploadId: string, columns: ColumnMap): Promise<ApiResponse<any>> {
  const endpoint = `upload/${uploadId}/set-column-mapping`;

  const response = await post(endpoint, columns);

  if (!response.ok) throw response.error;

  return {
    ok: true,
    error: "",
    data: response.data,
    status: response.status,
  };
}
