import { timeToText } from "@tableflowhq/ui-library";
import { TableData } from "@tableflowhq/ui-library/build/Table/types";
import Download from "../components/Download";
import { Import } from "../../../api/types";

export function importsTable(imports: Import[] = [], apiKey: string): TableData {
  return imports.map((importItem) => {
    return {
      "File ID": importItem.id,
      Importer: importItem.importer?.name,
      Rows: importItem.num_rows,
      "Created At": timeToText(importItem.created_at),
      _actions: {
        raw: importItem.id,
        content: <Download importItem={importItem} apiKey={apiKey} />,
      },
    };
  });
}
