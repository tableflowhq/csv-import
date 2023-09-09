import { AgGridReact } from "ag-grid-react";
import { TableProps } from "../types";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

function DataTable({ rowData, columnDefs, defaultColDef, cellClickedListener, theme }: TableProps) {
  return (
    <div
      className={theme === "dark" ? "ag-theme-alpine-dark" : "ag-theme-alpine"}
      style={{
        width: columnDefs?.length != null ? columnDefs.length * 200 : 100,
        height: rowData?.length != null ? (rowData.length + 1) * 43 : 100,
        border: "none",
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
      />
    </div>
  );
}

export default DataTable;
