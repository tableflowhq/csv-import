/* eslint-disable */
import { ColDef, GridReadyEvent, ICellRendererParams, IDatasource } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@tableflow/ui-library";
import useGetRows from "../../../api/useGetRows";
import { TableProps } from "../types";
import "./TableStyle.scss";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

function ReviewDataTable({ cellClickedListener, theme, uploadId, filter }: TableProps) {
  const gridRef: any = useRef(null);
  const [columnDefs, setColumnDefs] = useState<any>([]);

  const { data: initialRowData, fetchNextPage, isLoading } = useGetRows(uploadId, filter, 100, 0);

  useEffect(() => {
    gridRef.current?.purgeInfiniteCache();
    const total = initialRowData?.pages[0]?.pagination?.total || 0;

    total === 0 && gridRef.current?.showNoRowsOverlay();
    total > 0 && gridRef.current?.hideOverlay();
    setColumnSizes();
  }, [filter]);

  useEffect(() => {
    if (gridRef.current) {
      isLoading && gridRef.current.showLoadingOverlay();
      !isLoading && gridRef.current.hideOverlay();
      setColumnSizes();
    }
  }, [isLoading]);

  const onGridReady = (params: GridReadyEvent<any>) => {
    gridRef.current = params.api as any;
    setTimeout(() => {
      setColumnSizes();
    }, 10);

    const dataSource: IDatasource = {
      rowCount: initialRowData?.pages?.[0]?.pagination?.total || undefined,
      getRows: async (params: any) => {
        console.log("asking for " + params.startRow + " to " + params.endRow);

        const data = await fetchNextPage({
          pageParam: params.endRow,
        });
        const paginationInfo = data?.data?.pages[0]?.pagination;
        const rowThisPage = data?.data?.pages?.flatMap((page: any) => page?.rows) || [];

        let lastRow = -1;
        if (paginationInfo?.total !== undefined && paginationInfo.total <= params.endRow) {
          lastRow = paginationInfo.total;
        }
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

  useEffect(() => {
    if (initialRowData?.pages?.[0]?.rows?.[0]?.values) {
      const headers = Object.keys(initialRowData.pages[0]?.rows[0]?.values);
      const generatedColumnDefs = headers.map((header: string) => {
        return {
          headerName: header,
          field: `values.${header}`,
          cellStyle: (params: any) => {
            if (params.data?.errors?.[header]) {
              return { backgroundColor: "#f04339" };
            }
            return null;
          },
          cellRenderer: (params: ICellRendererParams) => {
            if (params.data) {
              return (
                <span
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                  }}>
                  <span>{params.value}</span>
                  {params.data?.errors?.[header] && (
                    <button title={params.data.errors[header][0].message}>
                      <Icon icon="help" />
                    </button>
                  )}
                </span>
              );
            }
          },
          sortable: false,
          filter: false,
          suppressMovable: true,
        } as ColDef;
      });
      setColumnDefs(generatedColumnDefs.reverse());
    }
  }, [initialRowData?.pages]);
  return (
    <div
      className={theme === "dark" ? "ag-theme-alpine-dark" : "ag-theme-alpine"}
      style={{
        // height: initialRowData?.pages?.flat()?.length != null ? (initialRowData?.pages?.flat()?.length + 1) * 43 : 100,
        height: 500,
      }}>
      <AgGridReact
        // rowData={initialRowData?.pages?.flatMap((page: any) => page?.rows) || []}
        columnDefs={columnDefs}
        defaultColDef={{}}
        animateRows={true}
        rowSelection="multiple"
        onCellValueChanged={cellClickedListener}
        onGridReady={onGridReady}
        infiniteInitialRowCount={100}
        cacheBlockSize={100}
        rowBuffer={0}
        rowModelType={"infinite"}
        cacheOverflowSize={2}
        maxConcurrentDatasourceRequests={1}
        maxBlocksInCache={10}
      />
    </div>
  );
}

export default ReviewDataTable;
