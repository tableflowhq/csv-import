import { useQuery, UseQueryResult } from "react-query";
import { ApiResponse, Importer } from "./types";
import { get, post } from "./api";

export default function useGetImporter(importerId: string, templateOverride: string): UseQueryResult<Importer> {
  return useQuery(["importer", importerId], () => (importerId ? getImporter(importerId, templateOverride) : {}));
}

async function getImporter(importerId: string, templateOverride: string) {
  let body;
  let isOverride = false;
  if (templateOverride && templateOverride.length > 0) {
    try {
      body = JSON.parse(templateOverride);
      isOverride = true;
    } catch (error) {
      throw `Invalid template: ${error}`;
    }
  }
  const response: ApiResponse<Importer> = await post(`importer/${importerId}`, body);

  if (!response.ok) throw response.error;

  response.data.template.is_override = isOverride;
  return response.data;
}
