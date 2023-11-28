import Badge from "../../../components/Badge";
import Dialog from "../../../components/Dialog";
import { DialogItem } from "../../../components/Dialog/types";
import { TableData } from "../../../components/Table/types";
import { TemplateColumn } from "../../../api/types";
import { EntityId, Update } from "../../../hooks/useEntitySelection";

export function columnsTable(columns: TemplateColumn[] = [], update: Update): TableData {
  const actionMenu: DialogItem[] = [
    { children: "Edit", action: (id: EntityId) => update(id, "edit") },
    { children: "Delete", action: (id: EntityId) => update(id, "delete") },
  ];

  const hasDescription = columns?.some((column) => column?.description);

  return columns.map((column) => {
    return {
      id: column.id,
      index: column.index,
      "Column Name": column.name,
      ...(hasDescription
        ? {
            Description: {
              raw: column?.description,
              content: <span>{column?.description}</span>,
              tooltip: column?.description,
            },
          }
        : {}),
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
