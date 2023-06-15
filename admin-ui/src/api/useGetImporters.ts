import { useQuery, UseQueryResult } from "react-query";
import { Importer } from "./types";
import { get } from "./api";

export default function useGetImporters(workspaceId: string): UseQueryResult<Importer[]> {
  return useQuery(["importers", workspaceId], () => (workspaceId ? getImporters(workspaceId) : []));
}

async function getImporters(workspaceId: string): Promise<Importer[]> {
  const response = await get(`importers/${workspaceId}`);

  if (!response.ok) throw response.error;

  return response.data;
}
