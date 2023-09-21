import { useMutation, UseMutationResult } from "react-query";
import { ApiResponse } from "./types";
import { post } from "./api";

export default function useSubmitReview(uploadId: string): UseMutationResult<ApiResponse<any>> {
  return useMutation(() => mutateReview(uploadId));
}

async function mutateReview(uploadId: string): Promise<ApiResponse<any>> {
  const endpoint = `import/${uploadId}/submit`;

  const response = await post(endpoint);

  if (!response.ok) throw response.error;

  return {
    ok: true,
    error: "",
    data: response.data,
    status: response.status,
  };
}
