import { ColDef } from "ag-grid-community";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Icon, useThemeStore } from "@tableflow/ui-library";
import useReview from "../../api/useReview";
import LoadingSpinner from "./components/LoadingSpinner";
import ReviewDataTable from "./components/ReviewDataTable";
import { ReviewProps } from "./types";
import style from "./style/Review.module.scss";

export default function Review({ onCancel, onSuccess, upload, showImportLoadingStatus }: ReviewProps) {
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
          sortable: false,
          filter: false,
          suppressMovable: true,
        } as ColDef;
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
        <div className={style.reviewContainer}>
          <div className={style.tableWrapper}>
            <ReviewDataTable
              rowData={csvData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              cellClickedListener={cellClickedListener}
              theme={theme}
            />
          </div>
          <div className={style.actions}>
            <Button type="button" variants={["secondary"]} onClick={onCancel}>
              Back
            </Button>
            <Button variants={["primary"]}>Submit</Button>
          </div>
        </div>
      )}
    </>
  );
}
