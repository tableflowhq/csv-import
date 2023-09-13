import { Link } from "react-router-dom";
import { Dialog, Icon, timeToText } from "@tableflow/ui-library";
import { DialogItem } from "@tableflow/ui-library/build/Dialog/types";
import { EntityId, Update } from "@tableflow/ui-library/build/hooks/useEntitySelection";
import { TableData } from "@tableflow/ui-library/build/Table/types";
import { Importer } from "../../../api/types";
import style from "../style/Importers.module.scss";

const LinkContainer = ({ children, importerId }: { children: React.ReactNode; importerId: string }) => (
  <Link to={`/importers/${importerId}/template`} className={style.rowLink}>
    <div className={style.tableName}>{children}</div>
  </Link>
);

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
          <LinkContainer importerId={importer.id}>
            <Icon icon="cube" size="m" />
            {importer.name}
          </LinkContainer>
        ),
      },
      "Template Columns": {
        raw: importer.template?.template_columns.length,
        content: <LinkContainer importerId={importer.id}>{importer.template?.template_columns.length}</LinkContainer>,
      },
      Created: {
        raw: timeToText(importer.created_at),
        content: <LinkContainer importerId={importer.id}>{timeToText(importer.created_at)}</LinkContainer>,
      },
      _actions: {
        raw: importer.id,
        content: <Dialog items={actionMenu.map((e) => ({ ...e, id: importer.id }))} />,
      },
    };
  });
}
