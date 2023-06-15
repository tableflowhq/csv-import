import { Box, Icon } from "@tableflowhq/ui-library";
import style from "./style/Complete.module.scss";

export default function Complete() {
  return (
    <Box className={style.content} variants={[]}>
      <span className={style.icon}>
        <Icon icon="check" />
      </span>
      <div>Upload Successful</div>
    </Box>
  );
}
