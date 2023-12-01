import Domains from "../forms/AllowedDomains";
import ApiKey from "../forms/ApiKey";
import useGetOrganization from "../../api/useGetOrganization";
import useComponentsStore from "../../stores/componentsStore";
import style from "./style/SettingsPage.module.scss";

export default function SettingsPage() {
  const { data: organization } = useGetOrganization();
  const workspace = organization?.workspaces?.[0];
  const workspaceId = workspace?.id || "";

  const components = useComponentsStore((state) => state.components);
  const { settingsPage: SettingsComponents } = components;

  return (
    <div className={style.wrapper}>
      <div className="container">
        <ApiKey workspaceId={workspaceId} />
        <Domains workspace={workspace} />

        {SettingsComponents && <SettingsComponents />}
      </div>
    </div>
  );
}
