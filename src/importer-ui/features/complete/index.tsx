import { Button } from "@chakra-ui/button";
import Box from "../../components/Box";
import { CompleteProps } from "./types";
import style from "./style/Complete.module.scss";
import { PiArrowCounterClockwise, PiCheckBold } from "react-icons/pi";

export default function Complete({ reload, close, isModal }: CompleteProps) {
  return (
    <Box className={style.content}>
      <>
        <span className={style.icon}>
          <PiCheckBold />
        </span>
        <div>Import Successful</div>
        <div className={style.actions}>
          <Button type="button" colorScheme="secondary" leftIcon={<PiArrowCounterClockwise />} onClick={reload}>
            Upload another file
          </Button>
          {isModal && (
            <Button type="button" colorScheme="primary" leftIcon={<PiCheckBold />} onClick={close}>
              Done
            </Button>
          )}
        </div>
      </>
    </Box>
  );
}
