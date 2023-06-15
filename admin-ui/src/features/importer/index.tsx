import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Badge, Icon, Tabs, timestampDisplay, useTabs } from "@tableflowhq/ui-library";
import usePostImporter from "../../api/usePostImporter";
import { ImporterViewProps } from "./types";
import style from "./style/Importer.module.scss";
import Code from "../code";
import Settings from "../settings";
import Templates from "../templates";

export default function ImporterPage({ importer }: ImporterViewProps) {
  const importerId = importer.id;

  const { importerTab } = useParams();

  console.log(importer);

  const templateCount = importer?.template?.template_columns?.length;

  const tabs = useTabs(
    { template: <>Template {!!templateCount && <small>{templateCount}</small>}</>, code: "Code", settings: "Settings" },
    importerTab || "template"
  );

  const navigate = useNavigate();

  const { tab } = tabs;

  useEffect(() => {
    navigate(`/importers/${importerId}/${tab}`);
  }, [tab]);

  const { mutate } = usePostImporter(importerId);

  return (
    <div className="container">
      <div className={style.importer}>
        <div className="container">
          <div className={style.top}>
            <div className={style.title}>
              <h1>{importer.name}</h1>
              <div className={style.actions}>
                <Icon icon="clock" />
                {timestampDisplay(importer.created_at)}
              </div>
            </div>
          </div>

          <Tabs {...tabs} />

          <div className={style.content}>
            {tab === "template" ? (
              <Templates importer={importer} />
            ) : tab === "code" ? (
              <Code importerId={importerId} />
            ) : tab === "settings" ? (
              <Settings importer={importer} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
