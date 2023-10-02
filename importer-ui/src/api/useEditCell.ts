import { useMutation, UseMutationResult } from "react-query";
import { ApiResponse } from "./types";
import { post } from "./api";

export default function useEditCell(uploadId: string): UseMutationResult<ApiResponse<any>> {
  return useMutation(({ rowIndex, isError: isErrorRow, cellKey, cellValue }: any) => mutateCell(uploadId, rowIndex, isErrorRow, cellKey, cellValue), {
    // onError: () => {},
  });
}

async function mutateCell(uploadId: string, rowIndex: number, isErrorRow: boolean, cellKey: string, cellValue: string): Promise<ApiResponse<any>> {
  const endpoint = `import/${uploadId}/cell/edit`;
  const body = {
    row_index: rowIndex,
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
