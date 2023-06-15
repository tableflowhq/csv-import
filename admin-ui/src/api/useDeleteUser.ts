import { useMutation, UseMutationResult, useQueryClient } from "react-query";
import { ApiResponse } from "./types";
import { remove } from "./api";

export default function useDeleteUser(): UseMutationResult<ApiResponse<any>> {
  const queryClient = useQueryClient();

  return useMutation((id: any) => deleteUser(id), {
    onSuccess: () => queryClient.invalidateQueries("users"),
  });
}

async function deleteUser(id: string): Promise<ApiResponse<any>> {
  const response = await remove(`user/${id}`);

  if (!response.ok) throw response.error;

  return {
    ok: true,
    error: "",
    data: response.data,
  };
}
