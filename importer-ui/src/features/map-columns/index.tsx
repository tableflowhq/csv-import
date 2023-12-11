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
  setColumnsValues,
  columnsValues,
  isLoading,
  onLoad,
}: MapColumnsProps) {
  const { mutate, error, isSuccess, isLoading: isLoadingPost } = usePostUpload(upload?.id || "");
  const [isDisabledControl, setIsDisabledControl] = useState(false);
  const { rows, formValues } = useMapColumnsTable(
    upload?.upload_columns,
    template?.columns,
    schemaless,
    schemalessReadOnly,
    columnsValues,
    isDisabledControl
  );
  const [selectedColumns, setSelectedColumns] = useState<any>([]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsDisabledControl(true);
    try {
      setColumnsValues(formValues);
      const columns = Object.keys(formValues).reduce((acc, key) => {
        const { template, use } = formValues[key];
        return { ...acc, ...(use ? { [key]: template } : {}) };
      }, {});
      setSelectedColumns(columns);

      mutate(columns);
    } catch (error) {
      setIsDisabledControl(false);
    } finally {
      setIsDisabledControl(false);
    }
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
            <Table data={rows} background="dark" fixHeader columnWidths={["20%", "30%", "30%", "20%"]} columnAlignments={["", "", "", "center"]} />
          </div>
        ) : (
          <>Loading...</>
        )}

        <div className={style.actions}>
          <Button type="button" colorScheme="secondary" onClick={onCancel} isDisabled={isLoading || isLoadingPost}>
            {skipHeaderRowSelection ? "Cancel" : "Back"}
          </Button>
          {!isLoading && !isLoadingPost && !!error && (
            <div className={style.errorContainer}>
              <Errors error={error} />
            </div>
          )}
          <Button colorScheme="primary" isLoading={isLoading || isLoadingPost} type="submit">
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
}
