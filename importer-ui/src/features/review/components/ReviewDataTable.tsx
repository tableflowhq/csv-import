/* eslint-disable */
import { GridReadyEvent, IDatasource } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useEffect, useRef } from "react";
import useGetRows from "../../../api/useGetRows";
import { TableProps } from "../types";
import "./TableStyle.scss";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

function ReviewDataTable({ columnDefs, defaultColDef, cellClickedListener, theme, uploadId }: TableProps) {
  const gridRef: any = useRef(null);
  const { data: initialRowData, fetchNextPage } = useGetRows(uploadId, "all", 100, 0);

  const onGridReady = (params: GridReadyEvent<any>) => {
    gridRef.current = params.api as any;
    setTimeout(() => {
      setColumnSizes();
    }, 10);

    const dataSource: IDatasource = {
      rowCount: undefined,
      getRows: async (params: any) => {
        console.log("asking for " + params.startRow + " to " + params.endRow);

        const data = await fetchNextPage();
        const rowThisPage = data?.data?.pages?.flatMap((page: any) => page?.rows) || [];
        const lastRow = data.hasNextPage ? -1 : rowThisPage.length;
        params.successCallback(rowThisPage, lastRow);
      },
    };
    params.api.setDatasource(dataSource);
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
        // height: initialRowData?.pages?.flat()?.length != null ? (initialRowData?.pages?.flat()?.length + 1) * 43 : 100,
        height: 500
      }}>
      <AgGridReact
        // rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        animateRows={true}
        tooltipShowDelay={0}
        tooltipHideDelay={999999}
        rowSelection="multiple"
        onCellValueChanged={cellClickedListener}
        onGridReady={onGridReady}
        infiniteInitialRowCount={100}
        rowBuffer={0}
        rowModelType={"infinite"}
        cacheBlockSize={100}
        cacheOverflowSize={2}
        maxConcurrentDatasourceRequests={1}
        maxBlocksInCache={10}
      />
    </div>
  );
}

export default ReviewDataTable;
