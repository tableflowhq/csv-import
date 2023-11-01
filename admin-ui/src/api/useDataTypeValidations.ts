import { useQuery, UseQueryResult } from "react-query";
import { DataTypeValidation } from "./types";
import { get } from "./api";

export default function useGetDataTypeValidations(workspaceId: string): UseQueryResult<DataTypeValidation> {
  return useQuery(["data-type-validations", workspaceId], () => (workspaceId ? getDataTypeValidations(workspaceId) : {}));
}

async function getDataTypeValidations(workspaceId: string): Promise<DataTypeValidation> {
  const response = await get(`workspace/${workspaceId}/datatype-validations`);
  if (!response.ok) throw response.error;

  return response.data;
}
