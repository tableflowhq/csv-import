import { Link } from "react-router-dom";
import Dialog from "../../../components/Dialog";
import { DialogItem } from "../../../components/Dialog/types";
import Icon from "../../../components/Icon";
import { TableData } from "../../../components/Table/types";
import { Importer } from "../../../api/types";
import { EntityId, Update } from "../../../hooks/useEntitySelection";
import { timeToText } from "../../../utils/time";
import style from "../style/Importers.module.scss";

export function importersTable(importers: Importer[] = [], update: Update): TableData {
  const actionMenu: DialogItem[] = [
    { children: "Edit", action: (id: EntityId) => update(id, "edit") },
    { children: "Delete", action: (id: EntityId) => update(id, "delete") },
  ];

  return importers.map((importer) => {
    return {
      id: importer.id,
      Name: {
        raw: importer.name,
        content: (
          <div className={style.tableName}>
            <Icon icon="cube" size="m" />
            <Link to={`/importers/${importer.id}/template`}>{importer.name}</Link>
          </div>
        ),
      },
      "Template Columns": importer.template?.template_columns.length,
      Created: timeToText(importer.created_at),
      _actions: {
        raw: importer.id,
        content: <Dialog items={actionMenu.map((e) => ({ ...e, id: importer.id }))} />,
      },
    };
  });
}
