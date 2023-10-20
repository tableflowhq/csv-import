import { useEffect } from "react";
import { Button } from "@chakra-ui/button";
import Errors from "../../components/Errors";
import Table from "../../components/Table";
import Tooltip from "../../components/Tooltip";
import usePostSetHeader from "../../api/usePostSetHeader";
import { RowSelectionProps } from "./types";
import style from "./style/RowSelection.module.scss";

export default function RowSelection({ upload, onSuccess, onCancel, selectedHeaderRow, setSelectedHeaderRow }: RowSelectionProps) {
  const { mutate, error, isSuccess, isLoading, data } = usePostSetHeader(upload?.id || "");

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedHeaderRow(Number(e.target.value));
  };

  const dataWithRadios = upload?.upload_rows?.map((row) => {
    const nameWithRadio = (
      <span>
        <input
          type="radio"
          id={`radio-${row.index}`}
          className={style.inputRadio}
          name="rowSelection"
          value={row.index}
          checked={selectedHeaderRow === row.index}
          onChange={handleRadioChange}
        />
        {row.values?.[0]}
      </span>
    );
    const mappedRow = Object.entries(row.values).map(([key, value]) => {
      return [
        key,
        {
          raw: value,
          content: key === "0" ? nameWithRadio : <span>{value}</span>,
          tooltip: value,
        },
      ];
    });
    return Object.fromEntries(mappedRow);
  });
  const maxNumberOfColumns = 7;
  const uploadRow = upload?.upload_rows?.[0] ?? { values: {} };
  const numberOfColumns = Math.min(Object.keys(uploadRow.values).length, maxNumberOfColumns);
  const widthPercentage = 100 / numberOfColumns;
  const columnWidths = Array(numberOfColumns).fill(`${widthPercentage}%`);

  const handleNextClick = (e: any) => {
    e.preventDefault();
    mutate({ selectedHeaderRow: selectedHeaderRow });
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
              fixHeader
              mergeThemes={true}
              data={dataWithRadios?.slice(0, maxNumberOfColumns) || []}
              heading={
                <div className={style.headingCaption}>
                  <Tooltip title="Select the row which contains the column headers">Select Header Row</Tooltip>
                </div>
              }
              keyAsId="index"
              background="zebra"
              columnWidths={columnWidths}
              columnAlignments={Array(numberOfColumns).fill("left")}
              onRowClick={(row) => setSelectedHeaderRow(dataWithRadios?.indexOf(row) || 0)}
            />
          </div>
        ) : (
          <>Loading...</>
        )}

        <div className={style.actions}>
          <Button type="button" colorScheme="secondary" onClick={onCancel} isDisabled={isLoading}>
            Cancel
          </Button>
          <Button colorScheme="primary" onClick={handleNextClick} isLoading={isLoading} type="submit">
            Continue
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
