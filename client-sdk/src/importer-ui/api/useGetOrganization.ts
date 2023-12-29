import { useQuery, UseQueryResult } from "react-query";
import { ApiResponse } from "./types";
import { get } from "./api";

export default function useGetOrganization(importerId: string, checkStatus: boolean): UseQueryResult<{ [key: string]: boolean }> {
  return useQuery(["organization", importerId], () => (importerId ? getOrganization(importerId, checkStatus) : {}));
}

async function getOrganization(importerId: string, checkStatus: boolean) {
  if (!checkStatus) {
    return null;
  }
  const response: ApiResponse<{ [key: string]: boolean }> = await get(`importer/${importerId}/organization/status`);

  return response.data;
}
