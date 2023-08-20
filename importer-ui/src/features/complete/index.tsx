import { useEffect, useMemo, useState } from "react";
import { Box, Button, Icon } from "@tableflow/ui-library";
import Spinner from "../../components/Spinner";
import useGetImport from "../../api/useGetImport";
import { CompleteProps } from "./types";
import style from "./style/Complete.module.scss";

export default function Complete({ reload, close, onSuccess, upload, showImportLoadingStatus }: CompleteProps) {
  const uploadMemo = useMemo(() => upload, [upload]);

  const { data, error } = useGetImport(uploadMemo?.id || "");
  const [showLoading, setShowLoading] = useState(true);
  const { is_stored: isStored } = data || {};

  const isEmbeddedInIframe = window?.top !== window?.self;

  useEffect(() => {
    if (isStored || error) {
      setShowLoading(false);
      onSuccess(data, data?.error || error?.toString() || null);
    }
  }, [isStored, error]);

  return (
    <>
      {showLoading && showImportLoadingStatus ? (
        <Spinner className={style.spinner}>Importing your data...</Spinner>
      ) : (
        <Box className={style.content} variants={[]}>
          <span className={style.icon}>
            <Icon icon="check" />
          </span>
          <div>Import Successful</div>
          <div className={style.actions}>
            {isEmbeddedInIframe && (
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
