import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Icon, useThemeStore } from "@tableflow/ui-library";
import useReview from "../../api/useReview";
import DataTable from "./components/DataTable";
import LoadingSpinner from "./components/LoadingSpinner";
import { DataValidationProps } from "./types";
import style from "./style/DataValidation.module.scss";

export default function Complete({ reload, onSuccess, upload, showImportLoadingStatus }: DataValidationProps) {
  const uploadMemo = useMemo(() => upload, [upload]);
  const uploadMemoId = uploadMemo?.id;

  const { data, error }: any = useReview(uploadMemoId);
  console.log(data);
  const csvData = data?.data?.rows || [];

  const [columnDefs, setColumnDefs] = useState<any>([]);

  const theme = useThemeStore((state) => state.theme);

  const [showLoading, setShowLoading] = useState(true);

  const isStored = data?.is_stored || {};

  const defaultColDef = useMemo(() => {
    return { sortable: true, filter: true, resizable: true };
  }, []);

  const cellClickedListener = useCallback((event: any) => {
    console.log("cellClicked", event);
  }, []);

  useEffect(() => {
    if (csvData.length > 0) {
      const headers = Object.keys(csvData[0].values);
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
          cellRenderer: (params: any) => {
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
        };
      });
      setColumnDefs(generatedColumnDefs.reverse());
    }
  }, [csvData]);

  // useEffect(() => {
  //   if (isStored || error) {
  //     setShowLoading(false);
  //     onSuccess(data, data?.error || error?.toString() || null);
  //   }
  // }, [isStored, error]);

  return (
    <>
      {showLoading && showImportLoadingStatus ? (
        <LoadingSpinner style={style} />
      ) : (
        <div>
          <DataTable
            rowData={csvData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            cellClickedListener={cellClickedListener}
            theme={theme}
          />
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
