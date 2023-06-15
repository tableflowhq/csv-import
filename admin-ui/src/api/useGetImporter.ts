import { useQuery, UseQueryResult } from "react-query";
import { Importer } from "./types";
import { get } from "./api";

export default function useGetImporter(id: string): UseQueryResult<Importer> {
  return useQuery(
    ["importer", id].filter((i) => i),
    () => (id ? getImporter(id) : {})
  );
}

async function getImporter(id: string): Promise<Importer> {
  // return importers[0];

  const response = await get(`importer/${id}`);

  if (!response.ok) throw response.error;

  return response.data;
}
