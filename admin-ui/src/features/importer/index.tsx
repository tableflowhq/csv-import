import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import Button from "../../components/Button";
import Tabs from "../../components/Tabs";
import useTabs from "../../components/Tabs/hooks/useTabs";
import { defaultAppHost, getImporterURL } from "../../api/api";
import { colors, sizes } from "../../settings/theme";
import useThemeStore from "../../stores/useThemeStore";
import notification from "../../utils/notification";
import { ImporterViewProps } from "./types";
import style from "./style/Importer.module.scss";
import Code from "../code";
import Settings from "../settings";
import Templates from "../templates";
import { PiArrowSquareOut, PiCopyBold, PiCubeBold } from "react-icons/pi";

export default function ImporterPage({ importer }: ImporterViewProps) {
  const importerId = importer.id;
  const { importerTab } = useParams();
  const templateCount = importer?.template?.template_columns?.length;
  const tabs = useTabs(
    {
      template: <>Template {!!templateCount && <small className={style.miniBadge}>{templateCount}</small>}</>,
      code: "Code",
      settings: "Settings",
    },
    importerTab || "template"
  );
  const navigate = useNavigate();
  const copyToClipboard = (text: string) => {
    // TODO: This won't work on non-secure origins (besides localhost), update to use a different method
    // https://stackoverflow.com/questions/51805395/navigator-clipboard-is-undefined
    navigator.clipboard.writeText(text);
    notification({ type: "success", message: "Copied to clipboard" });
  };
  const { tab } = tabs;
  const theme = useThemeStore((state) => state.theme);

  const importerURL = getImporterURL();
  const importerPreviewURL = `${importerURL}?importerId=${importerId}&darkMode=${theme === "light" ? "false" : "true"}`;
  // Only provide the importer host URL to the code preview if it's not being hosted on TableFlow
  const importerCodeURL = window.location.hostname === defaultAppHost ? "" : importerURL;

  useEffect(() => {
    if (importerTab !== tab) navigate(`/importers/${importerId}/${tab}`);
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (importerTab !== tab) tabs.setTab(importerTab);
  }, [importerTab]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="container">
      <div className={style.importer}>
        <div className="container">
          <div className={style.top}>
            <div className={style.heading}>
              <div>
                <div className={style.title}>
                  <PiCubeBold size={sizes.icon.xlarge} color={colors.primary} />
                  <h1>{importer.name}</h1>
                </div>

                <div className={style.subTitle}>
                  <Button type="button" variants={["bare", "square"]} onClick={() => copyToClipboard(importer.id)} title="Copy to clipboard">
                    <PiCopyBold size={20} color={colors.textSoft} />
                  </Button>
                  <small>{importer.id}</small>
                </div>
              </div>
            </div>
            <div>
              <Button
                icon={<PiArrowSquareOut size={18} />}
                type="button"
                variants={theme === "light" ? [] : ["secondary"]}
                onClick={() => window.open(importerPreviewURL, "_blank")}
                title="Open the importer in a new tab to preview">
                Preview
              </Button>
            </div>
          </div>

          <Tabs {...tabs} />

          <div className={style.content}>
            {tab === "template" ? (
              <Templates importer={importer} />
            ) : tab === "code" ? (
              <Code importerId={importerId} theme={theme} hostUrl={importerCodeURL} />
            ) : tab === "settings" ? (
              <Settings importer={importer} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
