import { useMutation, UseMutationResult, useQueryClient } from "react-query";
import { ApiResponse } from "./types";
import { remove } from "./api";

export default function useDeleteImporter(workspaceId = "", id = ""): UseMutationResult<ApiResponse<any>> {
  const queryClient = useQueryClient();

  return useMutation(() => deleteImporter(id), {
    onSuccess: () => queryClient.invalidateQueries(["importers", workspaceId]),
  });
}

async function deleteImporter(id: string): Promise<ApiResponse<any>> {
  const response = await remove(`importer/${id}`);

  if (!response.ok) throw response.error;

  return {
    ok: true,
    error: "",
    data: response.data,
  };
}
