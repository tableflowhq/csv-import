import { Link } from "react-router-dom";
import Dialog from "../../../components/Dialog";
import { DialogItem } from "../../../components/Dialog/types";
import { TableData } from "../../../components/Table/types";
import { Importer } from "../../../api/types";
import { EntityId, Update } from "../../../hooks/useEntitySelection";
import { colors, sizes } from "../../../settings/theme";
import { timeToText } from "../../../utils/time";
import style from "../style/Importers.module.scss";
import { PiCube } from "react-icons/pi";

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
            <PiCube size={sizes.icon.large} color={colors.primary} />
            {/*<PiCube className={style.importerIcon} size={24} />*/}
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
