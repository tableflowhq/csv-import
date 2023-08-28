import { useQuery, UseQueryResult } from "react-query";
import { ApiResponse, Importer } from "./types";
import { get, post } from "./api";

export default function useGetImporter(importerId: string, sdkDefinedTemplate: string): UseQueryResult<Importer> {
  return useQuery(["importer", importerId], () => (importerId ? getImporter(importerId, sdkDefinedTemplate) : {}));
}

async function getImporter(importerId: string, sdkDefinedTemplate: string) {
  let body;
  let isSDKDefined = false;
  if (sdkDefinedTemplate && sdkDefinedTemplate.length > 0) {
    try {
      body = JSON.parse(sdkDefinedTemplate);
      isSDKDefined = true;
    } catch (error) {
      throw `Invalid template: ${error}`;
    }
  }
  const response: ApiResponse<Importer> = await post(`importer/${importerId}`, body);

  if (!response.ok) throw response.error;

  response.data.template.is_sdk_defined = isSDKDefined;
  return response.data;
}
