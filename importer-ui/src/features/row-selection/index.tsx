import { useEffect } from "react";
import { Button, Errors, Table, Tooltip } from "@tableflow/ui-library";
import usePostSetHeader from "../../api/usePostSetHeader";
import { RowSelectionProps } from "./types";
import tableTheme from "../../style/Table.module.scss";
import style from "./style/RowSelection.module.scss";

export default function RowSelection({ upload, onSuccess, onCancel, selectedId, setSelectedId }: RowSelectionProps) {
  const { mutate, error, isSuccess, isLoading, data } = usePostSetHeader(upload?.id || "");

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedId(String(e.target.value));
  };

  const dataWithRadios = upload?.upload_rows?.map((row) => {
    const nameWithRadio = (
      <>
        <input
          type="radio"
          id={`radio-${row.index}`}
          className={style.inputRadio}
          name="rowSelection"
          value={row.index}
          checked={selectedId === String(row.index)}
          onChange={handleRadioChange}
        />
        <label htmlFor={`radio-${row.index}`}>{row.values[0]}</label>
      </>
    );

    return {
      ...row.values,
      0: {
        raw: row.values[0],
        content: nameWithRadio,
      },
    };
  });
  const maxNumberOfColumns = 7;
  const uploadRow = upload?.upload_rows[0] ?? { values: {} };
  const numberOfColumns = Math.min(Object.keys(uploadRow.values).length + 1, maxNumberOfColumns);
  const widthPercentage = 100 / numberOfColumns;
  const columnWidths = Array(numberOfColumns).fill(`${widthPercentage}%`);

  const handleNextClick = (e: any) => {
    e.preventDefault();
    mutate({ selectedRow: selectedId });
  };

  useEffect(() => {
    if (isSuccess && !error && !isLoading && upload) {
      onSuccess(data.data);
    }
  }, [isSuccess]);

  return (
    <div className={style.content}>
      <form>
        {upload ? (
          <div className={style.tableWrapper}>
            <Table
              theme={tableTheme}
              mergeThemes={true}
              data={dataWithRadios || []}
              heading={
                <div className={style.headingCaption}>
                  <Tooltip title="Select the row which contains the column headers">Select Header Row</Tooltip>
                </div>
              }
              keyAsId="index"
              background="zebra"
              columnWidths={columnWidths}
              columnAlignments={Array(numberOfColumns).fill("left")}
              fixHeader
            />
          </div>
        ) : (
          <>Loading...</>
        )}

        <div className={style.actions}>
          <Button type="button" variants={["secondary"]} onClick={onCancel}>
            Cancel
          </Button>
          <Button variants={["primary"]} onClick={handleNextClick}>
            Next
          </Button>
        </div>
        {!isLoading && !!error && (
          <div className={style.errorContainer}>
            <Errors error={error} />
          </div>
        )}
      </form>
    </div>
  );
}
