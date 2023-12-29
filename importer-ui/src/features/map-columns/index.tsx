import { FormEvent, useEffect, useState } from "react";
import { Button } from "@chakra-ui/button";
import Errors from "../../components/Errors";
import Table from "../../components/Table";
import { ColumnAlignment } from "../../components/Table/types";
import usePostUploadSetColumnMapping from "../../api/usePostUploadSetColumnMapping";
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
  schemalessDataTypes,
  setColumnsValues,
  columnsValues,
  isLoading,
  onLoad,
}: MapColumnsProps) {
  const { rows, formValues } = useMapColumnsTable(
    upload?.upload_columns,
    template?.columns,
    schemaless,
    schemalessReadOnly,
    schemalessDataTypes,
    columnsValues
  );
  const { mutate, error, isSuccess, isLoading: isLoadingPost } = usePostUploadSetColumnMapping(upload?.id || "");
  const [selectedColumns, setSelectedColumns] = useState<any>([]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setColumnsValues(formValues);

    const columns: any = {};
    const columnsToSubmit: any = {};
    Object.keys(formValues).forEach((key) => {
      const { template, use, dataType } = formValues[key];
      if (use) {
        columns[key] = template;
        columnsToSubmit[key] = { template_column_id: template, data_type: schemalessDataTypes ? dataType : "" };
      }
    });
    setSelectedColumns(columns);

    mutate(columnsToSubmit);
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
  let columnWidths = ["20%", "30%", "30%", "20%"];
  let columnAlignments: ColumnAlignment[] = ["", "", "", "center"];
  if (schemalessDataTypes) {
    columnWidths = ["20%", "23%", "23%", "22%", "12%"];
    columnAlignments = ["", "", "", "", "center"];
  }

  return (
    <div className={style.content}>
      <form onSubmit={onSubmit}>
        {upload ? (
          <div className={style.tableWrapper}>
            <Table data={rows} background="dark" fixHeader columnWidths={columnWidths} columnAlignments={columnAlignments} />
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
