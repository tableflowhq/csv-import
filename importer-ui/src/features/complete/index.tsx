import Box from "../../components/Box";
import Button from "../../components/Button";
import Spinner from "../../components/Spinner";
import useEmbedStore from "../../stores/embed";
import { CompleteProps } from "./types";
import style from "./style/Complete.module.scss";
import { PiArrowsClockwise, PiCheckBold } from "react-icons/pi";

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
            <PiCheckBold />
          </span>
          <div>Import Successful</div>
          <div className={style.actions}>
            <Button type="button" variants={["tertiary"]} icon={<PiArrowsClockwise />} onClick={reload}>
              Upload another file
            </Button>
            {isEmbeddedInIframe && isModal && (
              <Button type="button" variants={["primary"]} icon={<PiCheckBold />} onClick={close}>
                Done
              </Button>
            )}
          </div>
        </Box>
      )}
    </>
  );
}
