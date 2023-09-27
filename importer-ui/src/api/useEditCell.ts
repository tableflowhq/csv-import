import { useMutation, UseMutationResult } from "react-query";
import { ApiResponse } from "./types";
import { post } from "./api";

export default function useEditCell(uploadId: string): UseMutationResult<ApiResponse<any>> {
  return useMutation(({ rowIndex, isError, cellKey, cellValue }: any) => mutateCell(uploadId, rowIndex, isError, cellKey, cellValue), {
    // onError: () => {},
  });
}

async function mutateCell(uploadId: string, rowIndex: number, isError: boolean, cellKey: string, cellValue: string): Promise<ApiResponse<any>> {
  const endpoint = `import/${uploadId}/cell/edit`;
  const body = {
    row_index: rowIndex,
    is_error: isError,
    cell_key: cellKey,
    cell_value: cellValue,
  };

  const response = await post(endpoint, body);

  if (!response.ok) throw response.error;

  return {
    ok: true,
    error: "",
    data: response.data,
    status: response.status,
  };
}
