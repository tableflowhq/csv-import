import { Badge, Dialog } from "@tableflow/ui-library";
import { DialogItem } from "@tableflow/ui-library/build/Dialog/types";
import { EntityId, Update } from "@tableflow/ui-library/build/hooks/useEntitySelection";
import { TableData } from "@tableflow/ui-library/build/Table/types";
import { TemplateColumn } from "../../../api/types";

export function columnsTable(columns: TemplateColumn[] = [], update: Update): TableData {
  const actionMenu: DialogItem[] = [{ children: "Delete", action: (id: EntityId) => update(id, "delete") }];

  const hasDescription = columns?.some((column) => column?.description);

  return columns.map((column) => {
    return {
      id: column.id,
      "Column Name": column.name,
      ...(hasDescription ? { Description: column?.description } : {}),
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
