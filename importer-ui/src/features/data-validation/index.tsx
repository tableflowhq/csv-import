import { AgGridReact } from "ag-grid-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Icon, useThemeStore } from "@tableflow/ui-library";
import Spinner from "../../components/Spinner";
import { UploadRow } from "../../api/types";
import useGetImport from "../../api/useGetImport";
import { DataValidationProps } from "./types";
import style from "./style/DataValidation.module.scss";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

export default function Complete({ reload, onSuccess, upload, showImportLoadingStatus }: DataValidationProps) {
  const uploadMemo = useMemo(() => upload, [upload]);
  const uploadMemoId = uploadMemo?.id;

  const { data, error }: any = useGetImport(uploadMemoId);
  const csvData = data?.data?.rows || [];

  const gridRef = useRef<any>();
  const [rowData, setRowData] = useState<UploadRow[]>();
  const [columnDefs, setColumnDefs] = useState<any>([]);

  const theme = useThemeStore((state) => state.theme);

  const [showLoading, setShowLoading] = useState(true);
  const { is_stored: isStored } = data || {};

  const defaultColDef = useMemo(() => {
    return { sortable: true, filter: true, resizable: true };
  }, []);

  const cellClickedListener = useCallback((event: any) => {
    console.log("cellClicked", event);
  }, []);

  useEffect(() => {
    setRowData(csvData);

    if (csvData.length > 0) {
      const headers = Object.keys(csvData[0].values);
      const generatedColumnDefs = headers.map((header: string) => {
        return {
          headerName: header,
          field: `values.${header}`,
          editable: true,
          cellStyle: (params: any) => {
            if (params.data?.errors?.[header]) {
              return { backgroundColor: "#f04339" };
            }
            return null;
          },
          cellRenderer: (params: any) => {
            if (params.data) {
              console.log(params.data);
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
        };
      });
      setColumnDefs(generatedColumnDefs.reverse());
    }
  }, [csvData]);

  useEffect(() => {
    if (isStored || error) {
      setShowLoading(false);
      onSuccess(data, data?.error || error?.toString() || null);
    }
  }, [isStored, error]);

  return (
    <>
      {showLoading && showImportLoadingStatus ? (
        <Spinner className={style.spinner}>Importing your data...</Spinner>
      ) : (
        <div>
          <div
            className={theme === "dark" ? "ag-theme-alpine-dark" : "ag-theme-alpine"}
            style={{
              width: columnDefs?.length != null ? columnDefs.length * 200 : 100,
              height: rowData?.length != null ? (rowData.length + 1) * 43 : 100,
              border: "none",
            }}>
            <AgGridReact
              ref={gridRef}
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

          <div className={style.actions}>
            <Button type="button" variants={["secondary"]} onClick={reload}>
              Back
            </Button>
            <Button variants={["primary"]}>Submit</Button>
          </div>
        </div>
      )}
    </>
  );
}
