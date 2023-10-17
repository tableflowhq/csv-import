import { Button } from "@chakra-ui/button";
import Box from "../../components/Box";
import Spinner from "../../components/Spinner";
import useEmbedStore from "../../stores/embed";
import { CompleteProps } from "./types";
import style from "./style/Complete.module.scss";
import { PiArrowsClockwise, PiCheckBold, PiX } from "react-icons/pi";

export default function Complete({ reload, close, showImportLoadingStatus }: CompleteProps) {
  const { isModal } = useEmbedStore((state) => state.embedParams);

  const isEmbeddedInIframe = window?.top !== window?.self;

  return (
    <Box className={style.content}>
      {showImportLoadingStatus ? (
        <Spinner className={style.spinner}>Importing your data...</Spinner>
      ) : (
        <>
          <span className={style.icon}>
            <PiCheckBold />
          </span>
          <div>Import Successful</div>
          <div className={style.actions}>
            {isEmbeddedInIframe && isModal && (
              <Button type="button" colorScheme="tertiary" variant="outline" leftIcon={<PiX />} onClick={close}>
                Close
              </Button>
            )}
            <Button type="button" colorScheme="primary" leftIcon={<PiArrowsClockwise />} onClick={reload}>
              Upload another file
            </Button>
          </div>
        </>
      )}
    </Box>
  );
}
