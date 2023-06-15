import { useMutation, UseMutationResult, useQueryClient } from "react-query";
import { ApiResponse, ImporterFormFields } from "./types";
import { post } from "./api";

export default function usePostImporter(workspaceId: string, id?: string): UseMutationResult<ApiResponse<any>> {
  const queryClient = useQueryClient();

  return useMutation((values) => postImporter(values as ImporterFormFields), {
    onSettled: () => {
      queryClient.invalidateQueries(["importers", workspaceId]);
      if (id) queryClient.invalidateQueries(["importer", id]);
    },
  });
}

async function postImporter({ id, ...values }: ImporterFormFields): Promise<ApiResponse<any>> {
  const endpoint = "importer" + (id ? `/${id}` : "");
  const response = await post(endpoint, values);

  if (!response.ok) throw response.error;

  return {
    ok: true,
    error: "",
    data: response.data,
  };
}
