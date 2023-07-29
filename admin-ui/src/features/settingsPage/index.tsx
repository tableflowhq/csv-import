import ApiKey from "../forms/ApiKey";
import useComponentsStore from "../../stores/componentsStore";
import style from "./style/SettingsPage.module.scss";

export default function SettingsPage() {
  const components = useComponentsStore((state) => state.components);
  const { settingsPage: SettingsComponents } = components;

  return (
    <div className={style.wrapper}>
      <div className="container">
        <ApiKey />

        {SettingsComponents && <SettingsComponents />}
      </div>
    </div>
  );
}
