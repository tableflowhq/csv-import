import { useEffect } from "react";
import { Box, Button, Icon } from "@tableflow/ui-library";
import { CompleteProps } from "./types";
import style from "./style/Complete.module.scss";

export default function Complete({ reload, close, onSuccess }: CompleteProps) {
  useEffect(() => {
    onSuccess({ message: "Return processed data coming soon..." }, "");
  }, []);

  return (
    <Box className={style.content} variants={[]}>
      <span className={style.icon}>
        <Icon icon="check" />
      </span>
      <div>Upload Successful</div>
      <div className={style.actions}>
        <Button type="button" variants={["tertiary"]} icon="cross" onClick={close}>
          Close
        </Button>
        <Button type="button" variants={["primary"]} icon="update" onClick={reload}>
          Upload another file
        </Button>
      </div>
      {/* {isLoading && <div className={style.loading}>Loading...</div>} */}
    </Box>
  );
}
