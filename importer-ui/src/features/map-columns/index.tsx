import { FormEvent, useEffect, useState } from "react";
import { Button } from "@chakra-ui/button";
import Errors from "../../components/Errors";
import Table from "../../components/Table";
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
  schemalessReadOnly,
  seColumnsValues,
  columnsValues,
  isLoading,
  onLoad,
}: MapColumnsProps) {
  const { rows, formValues } = useMapColumnsTable(upload?.upload_columns, template?.columns, schemaless, schemalessReadOnly, columnsValues);
  const { mutate, error, isSuccess, isLoading: isLoadingPost } = usePostUpload(upload?.id || "");
  const [selectedColumns, setSelectedColumns] = useState<any>([]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    seColumnsValues(formValues);
    const columns = Object.keys(formValues).reduce((acc, key) => {
      const { template, use } = formValues[key];
      return { ...acc, ...(use ? { [key]: template } : {}) };
    }, {});
    setSelectedColumns(columns);

    mutate(columns);
  };

  useEffect(() => {
    onLoad && onLoad();
  }, [JSON.stringify(formValues)]);

  useEffect(() => {
    if (isSuccess && !error && !isLoadingPost && upload) {
      onSuccess(upload.id, selectedColumns);
    }
  }, [isSuccess, error, isLoading, isLoadingPost]);

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
          <Button type="button" colorScheme="secondary" onClick={onCancel}>
            {skipHeaderRowSelection ? "Cancel" : "Back"}
          </Button>
          <Button colorScheme="primary" isLoading={isLoading || isLoadingPost} type="submit">
            Continue
          </Button>
        </div>

        {!isLoading && !isLoadingPost && !!error && (
          <div className={style.errorContainer}>
            <Errors error={error} />
          </div>
        )}
      </form>
    </div>
  );
}
