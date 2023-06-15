import { useMutation, UseMutationResult, useQueryClient } from "react-query";
import { ApiResponse } from "./types";
import { remove } from "./api";

export default function useDeleteTemplateColumn(): UseMutationResult<ApiResponse<any>> {
  const queryClient = useQueryClient();

  return useMutation((id: any) => deleteTemplateColumn(id), {
    onSuccess: () => queryClient.invalidateQueries("templates"),
  });
}

async function deleteTemplateColumn(id: string): Promise<ApiResponse<any>> {
  const response = await remove(`template-column/${id}`);

  if (!response.ok) throw response.error;

  return {
    ok: true,
    error: "",
    data: response.data,
  };
}
