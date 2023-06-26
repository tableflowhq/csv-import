import { Box, Button, Icon } from "@tableflowhq/ui-library";
import { CompleteProps } from "./types";
import style from "./style/Complete.module.scss";

export default function Complete({ reload, close }: CompleteProps) {
  return (
    <Box className={style.content} variants={[]}>
      <span className={style.icon}>
        <Icon icon="check" />
      </span>
      <div>Upload Successful</div>
      <div className={style.actions}>
        <Button type="button" variants={["primary"]} icon="update" onClick={reload}>
          Upload another file
        </Button>
        <Button type="button" variants={["noFill"]} icon="cross" onClick={close}>
          Close
        </Button>
      </div>
    </Box>
  );
}
