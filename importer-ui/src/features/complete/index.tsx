import Box from "../../components/Box";
import Button from "../../components/Button";
import Spinner from "../../components/Spinner";
import useEmbedStore from "../../stores/embed";
import { CompleteProps } from "./types";
import style from "./style/Complete.module.scss";
import { FaArrowsRotate, FaCheck, FaCross } from "react-icons/fa6";

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
            <FaCheck />
          </span>
          <div>Import Successful</div>
          <div className={style.actions}>
            {isEmbeddedInIframe && isModal && (
              <Button type="button" variants={["tertiary"]} icon={<FaCross />} onClick={close}>
                Close
              </Button>
            )}
            <Button type="button" variants={["primary"]} icon={<FaArrowsRotate />} onClick={reload}>
              Upload another file
            </Button>
          </div>
        </Box>
      )}
    </>
  );
}
