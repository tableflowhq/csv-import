import { useQuery, UseQueryResult } from "react-query";
import { Template } from "./types";
import { get } from "./api";

export default function useGetTemplate(id?: string): UseQueryResult<Template> {
  return useQuery(["template", id], () => (id ? getTemplate(id) : ({} as Template)));
}

async function getTemplate(id?: string): Promise<Template> {
  const response = await get(`template/${id}`);

  if (!response.ok) throw response.error;

  return response.data;
}
