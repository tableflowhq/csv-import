import { Badge, Dialog } from "@tableflowhq/ui-library";
import { DialogItem } from "@tableflowhq/ui-library/build/Dialog/types";
import { EntityId, Update } from "@tableflowhq/ui-library/build/hooks/useEntitySelection";
import { TableData } from "@tableflowhq/ui-library/build/Table/types";
import { TemplateColumn } from "../../../api/types";

export function columnsTable(columns: TemplateColumn[] = [], update: Update): TableData {
  const actionMenu: DialogItem[] = [{ children: "Delete", action: (id: EntityId) => update(id, "delete") }];

  return columns.map((column) => {
    return {
      id: column.id,
      "Column Name": column.name,
      Key: column.key,
      Required: {
        raw: column.required,
        content: column.required ? (
          <span>
            <Badge variants={["success"]}>Yes</Badge>
          </span>
        ) : (
          <span>
            <Badge variants={["neutral"]}>No</Badge>
          </span>
        ),
      },
      _actions: {
        raw: column.id,
        content: <Dialog items={actionMenu.map((e) => ({ ...e, id: column.id }))} />,
      },
    };
  });
}
