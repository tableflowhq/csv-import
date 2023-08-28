import { useMutation, UseMutationResult } from "react-query";
import { ApiResponse } from "./types";
import { post } from "./api";

export default function usePostSetHeader(uploadId: string): UseMutationResult<ApiResponse<any>> {
  return useMutation(({ selectedRow }: any) => mutateHeader(uploadId, selectedRow));
}

async function mutateHeader(uploadId: string, rowIndex: string): Promise<ApiResponse<any>> {
  const endpoint = `upload/${uploadId}/set-header-row`;

  const response = await post(endpoint, {
    index: Number(rowIndex),
  });

  if (!response.ok) throw response.error;

  return {
    ok: true,
    error: "",
    data: response.data,
    status: response.status,
  };
}
