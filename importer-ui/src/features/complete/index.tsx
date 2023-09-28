import { Box, Button, Icon } from "@tableflow/ui-library";
import Spinner from "../../components/Spinner";
import useEmbedStore from "../../stores/embed";
import { CompleteProps } from "./types";
import style from "./style/Complete.module.scss";

export default function Complete({ reload, close, showImportLoadingStatus }: CompleteProps) {
  const { isModal } = useEmbedStore((state) => state.embedParams);

  const isEmbeddedInIframe = window?.top !== window?.self;

  return (
    <>
      {showImportLoadingStatus ? (
        <Spinner className={style.spinner}>Importing your data...</Spinner>
      ) : (
        <Box className={style.content} variants={[]}>
          <span className={style.icon}>
            <Icon icon="check" />
          </span>
          <div>Import Successful</div>
          <div className={style.actions}>
            {isEmbeddedInIframe && isModal && (
              <Button type="button" variants={["tertiary"]} icon="cross" onClick={close}>
                Close
              </Button>
            )}
            <Button type="button" variants={["primary"]} icon="update" onClick={reload}>
              Upload another file
            </Button>
          </div>
        </Box>
      )}
    </>
  );
}
