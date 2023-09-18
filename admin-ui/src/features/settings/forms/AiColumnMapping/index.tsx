import { ChangeEvent } from "react";
import { useParams } from "react-router";
import { Box, Errors, Switch } from "@tableflow/ui-library";
import style from "./style/AiColumnMapping.module.scss";
import useGetImporter from "../../../../api/useGetImporter";
import usePostImporter from "../../../../api/usePostImporter";

export default function AiColumnMapping() {
  const { importerId } = useParams();

  const { data: importer, isLoading } = useGetImporter(importerId && importerId !== "new" ? importerId : "");

  const { enable_ai_column_mapping: enabled } = importer || {};

  const { mutate, error } = usePostImporter("", importer?.id);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    mutate({ id: importer?.id, enable_ai_column_mapping: e?.target?.checked });
  };

  if (isLoading) return null;
  return (
    <>
      <h3>Ai Column Mapping</h3>
      <p>
        Send header row data from uploaded file and template configuration to TableFlow's AI service to assist with column mappings.
      </p>
      <Box className={style.box} variants={["bg-shade"]}>
        <div className={style.switchWrapper}>
          <label>Enable AI column mapping:</label>
          <Switch className={style.switch} checked={!!enabled} onChange={onChange} />
        </div>
      </Box>
      <Errors error={''} />
    </>
  );
}
