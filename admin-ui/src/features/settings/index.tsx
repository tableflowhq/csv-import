import { Box } from "@tableflow/ui-library";
import { Importer } from "../../api/types";
import useComponentsStore from "../../stores/componentsStore";
import Domains from "./forms/Domains";
import style from "./style/Settings.module.scss";

export default function Settings({ importer }: { importer: Importer }) {
  const components = useComponentsStore((state) => state.components);
  const { importerSettings: SettingsComponents } = components;

  return (
    <div className={style.container}>
      <div className={style.column}>
        <h3>Allowed Domains</h3>
        <p>Add domains to restrict where the importer can be hosted. If no domains are added, the importer will allow uploads from anywhere.</p>

        <Box className={style.box} variants={["bg-shade"]}>
          <Domains importer={importer} />
        </Box>
      </div>

      {SettingsComponents && (
        <div className={style.column}>
          <SettingsComponents />
        </div>
      )}
    </div>
  );
}
