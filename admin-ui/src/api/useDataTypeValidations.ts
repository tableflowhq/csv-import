import { useQuery, UseQueryResult } from "react-query";
import { get } from "./api";
import { ValidationOptionsType } from "./types";

export default function useGetDataTypeValidations(workspaceId: string): UseQueryResult<ValidationOptionsType> {
  return useQuery(["data-type-validations", workspaceId], () => (workspaceId ? getDataTypeValidations(workspaceId) : {}));
}

async function getDataTypeValidations(workspaceId: string): Promise<ValidationOptionsType> {
  const response = await get(`workspace/${workspaceId}/datatype-validations`);
  if (!response.ok) throw response.error;

  return response.data;
}
