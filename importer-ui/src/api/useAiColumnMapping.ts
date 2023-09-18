import { useQuery, UseQueryResult } from "react-query";
import { ApiResponse, CsvTemplateMapping, MappedColumns } from "./types";
import { get } from "./api";

export default function useAiColumnMapping(tusId: string, isAiColumnMappingEnabled?: boolean): UseQueryResult<CsvTemplateMapping> {
  return useQuery(["mappedcolumns", tusId, isAiColumnMappingEnabled], () => (tusId ? getAiColumMapping(tusId, isAiColumnMappingEnabled) : {}));
}

async function getAiColumMapping(tusId: string, isAiColumnMappingEnabled?: boolean) {
  if (!isAiColumnMappingEnabled) return {};

  const response: ApiResponse<MappedColumns[]> = await get(`upload/${tusId}/match-columns`, true);
  if (!response.ok) throw response.error;

  const output_data: CsvTemplateMapping = response.data.reduce((result: CsvTemplateMapping, item: MappedColumns) => {
    result[item.csv_column] = item.template_column;
    return result;
  }, {});

  return output_data;
}
