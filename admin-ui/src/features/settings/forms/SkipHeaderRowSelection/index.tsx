import { ChangeEvent } from "react";
import { useParams } from "react-router";
import { Box, Errors, Switch } from "@tableflow/ui-library";
import useGetImporter from "../../../../api/useGetImporter";
import usePostImporter from "../../../../api/usePostImporter";
import style from "./style/SkipHeaderRowSelection.module.scss";

export default function SkipHeaderRowSelection() {
  const { importerId } = useParams();

  const { data: importer, isLoading } = useGetImporter(importerId && importerId !== "new" ? importerId : "");

  const { skip_header_row_selection: enabled } = importer || {};

  const { mutate, error } = usePostImporter("", importer?.id);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    mutate({ id: importer?.id, skip_header_row_selection: e?.target?.checked });
  };

  if (isLoading) return null;

  return (
    <>
      <h3>Skip Header Row Selection</h3>
      <p>
        If enabled, the importer will skip the Select Header step and always choose the first row of the file for the column headers. This option can
        also be enabled in the{" "}
        <a href="https://tableflow.com/docs/sdk-reference/react#properties" target="_blank">
          SDK
        </a>
        .
      </p>
      <Box className={style.box} variants={["bg-shade"]}>
        <div className={style.switchWrapper}>
          <label>Skip header row selection:</label>
          <Switch className={style.switch} checked={!!enabled} onChange={onChange} />
        </div>
      </Box>
      <Errors error={error} />
    </>
  );
}
