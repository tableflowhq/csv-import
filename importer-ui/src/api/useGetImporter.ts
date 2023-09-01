import { useQuery, UseQueryResult } from "react-query";
import { ApiResponse, Importer } from "./types";
import { get, post } from "./api";

export default function useGetImporter(importerId: string, sdkDefinedTemplate: string, schemaless?: boolean): UseQueryResult<Importer> {
  return useQuery(["importer", importerId], () => (importerId ? getImporter(importerId, sdkDefinedTemplate, schemaless) : {}));
}

async function getImporter(importerId: string, sdkDefinedTemplate: string, schemaless?: boolean) {
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
  let params = "";
  if (schemaless) {
    params = "?schemaless=true";
  }
  const response: ApiResponse<Importer> = await post(`importer/${importerId}${params}`, body);

  if (!response.ok) throw response.error;

  response.data.template.is_sdk_defined = isSDKDefined;
  return response.data;
}
