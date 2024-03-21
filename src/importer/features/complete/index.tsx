import { useTranslation } from "react-i18next";
import { Button } from "@chakra-ui/button";
import Box from "../../components/Box";
import { CompleteProps } from "./types";
import style from "./style/Complete.module.scss";
import { PiArrowCounterClockwise, PiCheckBold } from "react-icons/pi";

export default function Complete({ reload, close, isModal }: CompleteProps) {
  const { t } = useTranslation();
  return (
    <Box className={style.content}>
      <>
        <span className={style.icon}>
          <PiCheckBold />
        </span>
        <div>{t("Import Successful")}</div>
        <div className={style.actions}>
          <Button type="button" colorScheme="secondary" leftIcon={<PiArrowCounterClockwise />} onClick={reload}>
            {t("Upload another file")}
          </Button>
          {isModal && (
            <Button type="button" colorScheme="primary" leftIcon={<PiCheckBold />} onClick={close}>
              {t("Done")}
            </Button>
          )}
        </div>
      </>
    </Box>
  );
}
