import { timeToText } from "@tableflowhq/ui-library";
import { TableData } from "@tableflowhq/ui-library/build/Table/types";
import { Import } from "../../../api/types";

export function importsTable(imports: Import[] = []): TableData {
  return imports.map((importEl) => {
    return {
      "File ID": importEl.id,
      Importer: importEl.importer_id,
      Rows: importEl.num_rows,
      "Created At": timeToText(importEl.created_at),
      _actions: {
        raw: importEl.id,
        content: <span />,
      },
    };
  });
}
