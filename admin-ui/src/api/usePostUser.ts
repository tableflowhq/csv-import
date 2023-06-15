import { useMutation, UseMutationResult, useQueryClient } from "react-query";
import { ApiResponse, UserFormFields } from "./types";
import { post } from "./api";

export default function usePostUser(): UseMutationResult<ApiResponse<any>> {
  const queryClient = useQueryClient();

  return useMutation((values) => postUser(values as UserFormFields), {
    onSuccess: () => queryClient.invalidateQueries("users"),
  });
}

async function postUser({ id, ...values }: UserFormFields): Promise<ApiResponse<any>> {
  const endpoint = "user" + (id ? `/${id}` : "");

  const response = await post(endpoint, values);

  if (!response.ok) throw response.error;

  return {
    ok: true,
    error: "",
    data: response.data,
  };
}
