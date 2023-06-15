import { useQuery, UseQueryResult } from "react-query";
import { ApiResponse, Importer } from "./types";
import { get } from "./api";

export default function useGetImporter(importerId: string): UseQueryResult<Importer> {
  return useQuery(["importer", importerId], () => (importerId ? getImporter(importerId) : {}));
}

async function getImporter(importerId: string) {
  const response: ApiResponse<Importer> = await get(`importer/${importerId}`);

  if (!response.ok) throw response.error;

  return response.data;
}
