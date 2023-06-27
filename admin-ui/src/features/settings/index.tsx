import { Box } from "@tableflowhq/ui-library";
import { Importer } from "../../api/types";
import Domains from "./forms/Domains";
import Webhook from "./forms/Webhook";
import style from "./style/Settings.module.scss";

export default function Settings({ importer }: { importer: Importer }) {
  return (
    <div className={style.container}>
      <div className={style.column}>
        <h3>Allowed Domains</h3>
        <p>Add domains to restrict where the importer can be hosted. If no domains are added, the importer will allow uploads from anywhere.</p>
        <Box className={style.box} variants={["bg-shade"]}>
          <Domains importer={importer} />
        </Box>
      </div>

      <div className={style.column}>
        {/*<h3>Webhook URL</h3>*/}
        {/*<p>Notifications on import completion</p>*/}
        {/*<Box className={style.box}>*/}
        {/*  <Webhook importer={importer} />*/}
        {/*</Box>*/}
      </div>
    </div>
  );
}
