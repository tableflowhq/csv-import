import { useMutation, UseMutationResult, useQueryClient } from "react-query";
import { ApiResponse, WorkspaceFormFields } from "./types";
import { post } from "./api";

export default function usePostWorkspace(id?: string): UseMutationResult<ApiResponse<any>> {
  const queryClient = useQueryClient();

  return useMutation((values) => postWorkspace(values as WorkspaceFormFields), {
    onSettled: () => {
      queryClient.invalidateQueries(["organization-workspaces"]);
    },
  });
}

async function postWorkspace({ id, ...values }: WorkspaceFormFields): Promise<ApiResponse<any>> {
  const endpoint = "workspace" + (id ? `/${id}` : "");
  const response = await post(endpoint, values);

  if (!response.ok) throw response.error;

  return {
    ok: true,
    error: "",
    data: response.data,
  };
}
