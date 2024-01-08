import { FormEvent, useState } from "react";
import { Button } from "@chakra-ui/button";
import Table from "../../components/Table";
import useMapColumnsTable from "./hooks/useMapColumnsTable";
import { MapColumnsProps, TemplateColumnMapping } from "./types";
import style from "./style/MapColumns.module.scss";
import { Template, UploadColumn } from "../../api/types";
import Errors from "../../components/Errors";

export default function MapColumns({
  template,
  data,
  columnMapping,
  selectedHeaderRow,
  skipHeaderRowSelection,
  onSuccess,
  onCancel,
  isSubmitting,
}: MapColumnsProps) {
  if (data.rows.length === 0) {
    return null;
  }
  const headerRowIndex = selectedHeaderRow ? selectedHeaderRow : 0;
  let sampleDataRows = data.rows.slice(headerRowIndex + 1, headerRowIndex + 4);

  const uploadColumns: UploadColumn[] = data.rows[headerRowIndex]?.values.map((cell, index) => {
    let sample_data = sampleDataRows.map((row) => row.values[index]);
    return {
      index: index,
      name: cell,
      sample_data,
    };
  });
  const { rows, formValues } = useMapColumnsTable(uploadColumns, template.columns, columnMapping, isSubmitting);
  const [error, setError] = useState<string | null>(null);

  const verifyRequiredColumns = (template: Template, formValues: { [uploadColumnIndex: number]: TemplateColumnMapping }): boolean => {
    const requiredColumns = template.columns.filter((column: any) => column.required);
    const includedValues = Object.values(formValues).filter((value: any) => value.include);
    return requiredColumns.every((requiredColumn: any) => includedValues.some((includedValue: any) => includedValue.key === requiredColumn.key));
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const columns = Object.entries(formValues).reduce(
      (acc, [index, columnMapping]) =>
        columnMapping.include
          ? {
              ...acc,
              [index]: columnMapping,
            }
          : acc,
      {}
    );

    const isRequiredColumnsIncluded = verifyRequiredColumns(template, formValues);
    if (!isRequiredColumnsIncluded) {
      setError("Please include all required columns");
      return;
    }

    onSuccess(columns);
  };

  return (
    <div className={style.content}>
      <form onSubmit={onSubmit}>
        {data ? (
          <div className={style.tableWrapper}>
            <Table data={rows} background="dark" fixHeader columnWidths={["20%", "30%", "30%", "20%"]} columnAlignments={["", "", "", "center"]} />
          </div>
        ) : (
          <>Loading...</>
        )}

        <div className={style.actions}>
          <Button type="button" colorScheme="secondary" onClick={onCancel} isDisabled={isSubmitting}>
            {skipHeaderRowSelection ? "Cancel" : "Back"}
          </Button>
          {!!error && (
            <div className={style.errorContainer}>
              <Errors error={error} />
            </div>
          )}
          <Button colorScheme="primary" isLoading={isSubmitting} type="submit">
            Submit
          </Button>
        </div>
      </form>
    </div>
  );
}
