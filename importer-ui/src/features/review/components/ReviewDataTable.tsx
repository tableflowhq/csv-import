/* eslint-disable */
import { GridReadyEvent } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useEffect, useRef } from "react";
import { TableProps } from "../types";
import "./TableStyle.scss";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

function ReviewDataTable({ rowData, columnDefs, defaultColDef, cellClickedListener, theme }: TableProps) {
  const gridRef: any = useRef(null);

  const onGridReady = (params: GridReadyEvent<any>) => {
    gridRef.current = params.api as any;
    setTimeout(() => {
      setColumnSizes();
    }, 10);
  };

  window.addEventListener("resize", () => {
    setColumnSizes();
  });

  const setColumnSizes = () => {
    gridRef.current && gridRef.current?.sizeColumnsToFit();
  };

  return (
    <div
      className={theme === "dark" ? "ag-theme-alpine-dark" : "ag-theme-alpine"}
      style={{
        height: rowData?.length != null ? (rowData.length + 1) * 43 : 100,
      }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        animateRows={true}
        tooltipShowDelay={0}
        tooltipHideDelay={999999}
        rowSelection="multiple"
        onCellValueChanged={cellClickedListener}
        onGridReady={onGridReady}
        infiniteInitialRowCount={100}
      />
    </div>
  );
}

export default ReviewDataTable;
