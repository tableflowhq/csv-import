import { FormEvent, useEffect } from "react";
import { Button, Errors, Table } from "@tableflow/ui-library";
import usePostUpload from "../../api/usePostUpload";
import useMapColumnsTable from "./hooks/useMapColumnsTable";
import { MapColumnsProps } from "./types";
import style from "./style/MapColumns.module.scss";

export default function MapColumns({
  upload,
  template,
  onSuccess,
  onCancel,
  skipHeaderRowSelection,
  schemaless,
  seColumnsValues,
  columnsValues,
}: MapColumnsProps) {
  const { rows, formValues } = useMapColumnsTable(upload?.upload_columns, template?.columns, schemaless, columnsValues);
  const { mutate, error, isSuccess, isLoading } = usePostUpload(upload?.id || "");

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    seColumnsValues(formValues);
    const columns = Object.keys(formValues).reduce((acc, key) => {
      const { template, use } = formValues[key];
      return { ...acc, ...(use ? { [key]: template } : {}) };
    }, {});

    mutate(columns);
  };

  useEffect(() => {
    if (isSuccess && !error && !isLoading && upload) {
      onSuccess(upload.id);
    }
  }, [isSuccess, error, isLoading]);

  if (!rows || !rows?.length) return null;

  return (
    <div className={style.content}>
      <form onSubmit={onSubmit}>
        {upload ? (
          <div className={style.tableWrapper}>
            <Table data={rows} background="dark" columnWidths={["20%", "30%", "30%", "20%"]} columnAlignments={["", "", "", "center"]} />
          </div>
        ) : (
          <>Loading...</>
        )}

        <div className={style.actions}>
          <Button type="button" variants={["secondary"]} onClick={onCancel}>
            {skipHeaderRowSelection ? "Cancel" : "Back"}
          </Button>
          <Button variants={["primary"]} disabled={isLoading}>
            Continue
          </Button>
        </div>

        {!isLoading && !!error && (
          <div className={style.errorContainer}>
            <Errors error={error} />
          </div>
        )}

        {isSuccess && <p>Success!</p>}
      </form>
    </div>
  );
}
