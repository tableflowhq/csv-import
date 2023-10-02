import { useMutation, UseMutationResult } from "react-query";
import { ApiResponse } from "./types";
import { post } from "./api";

export default function usePostReviewEditCell(uploadId: string): UseMutationResult<ApiResponse<any>> {
  return useMutation(({ body }: any) => mutateEditCell(uploadId, body));
}

async function mutateEditCell(uploadId: string, body: any): Promise<ApiResponse<any>> {
  const endpoint = `import/${uploadId}/cell/edit`;

  const response = await post(endpoint, body);

  if (!response.ok) throw response.error;

  return {
    ok: true,
    error: "",
    data: response.data,
    status: response.status,
  };
}
