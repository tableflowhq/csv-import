import { ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, useThemeStore } from "@tableflow/ui-library";
import { UploadRow } from "../../api/types";
import { DataValidationProps } from "./types";
import style from "./style/DataValidation.module.scss";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

export default function DataValidation({ upload, onCancel }: DataValidationProps) {
  const gridRef = useRef<any>();
  const [rowData, setRowData] = useState<UploadRow[]>();
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);

  const theme = useThemeStore((state) => state.theme);

  const defaultColDef = useMemo(() => {
    return { sortable: true, filter: true, resizable: true };
  }, []);

  const cellClickedListener = useCallback((event: any) => {
    console.log("cellClicked", event);
  }, []);

  useEffect(() => {
    setRowData(upload.upload_rows);

    const generatedColumnDefs = upload.upload_columns.map((column) => ({
      headerName: column.name,
      field: `values.${column.index}`, // Assuming 'index' is the column index in values
    }));
    setColumnDefs(generatedColumnDefs);
  }, [upload]);

  return (
    <div>
      <div
        className={theme === "dark" ? "ag-theme-alpine-dark" : "ag-theme-alpine"}
        style={{
          width: 1000,
          height: 500,
        }}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          animateRows={true}
          rowSelection="multiple"
          onCellClicked={cellClickedListener}
        />
      </div>

      <div className={style.actions}>
        <Button type="button" variants={["secondary"]} onClick={onCancel}>
          Back
        </Button>
        <Button variants={["primary"]}>Submit</Button>
      </div>
    </div>
  );
}
