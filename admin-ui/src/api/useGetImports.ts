import { useQuery, UseQueryResult } from "react-query";
import imports from "./demo/imports";
import { Import } from "./types";
import { get } from "./api";

export default function useGetImports(workspaceId: string): UseQueryResult<Import[]> {
  return useQuery(["imports", workspaceId], () => (workspaceId ? getImports(workspaceId) : []));
}

async function getImports(workspaceId: string): Promise<Import[]> {
  return imports;

  const response = await get(`imports/${workspaceId}`);

  if (!response.ok) throw response.error;

  return response.data;
}
