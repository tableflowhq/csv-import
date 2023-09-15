import { ColDef } from "ag-grid-community";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Icon, ToggleFilter, useThemeStore } from "@tableflow/ui-library";
import useReview from "../../api/useReview";
import LoadingSpinner from "./components/LoadingSpinner";
import ReviewDataTable from "./components/ReviewDataTable";
import { ReviewProps } from "./types";
import style from "./style/Review.module.scss";

export default function Review({ onCancel, onSuccess, upload, showImportLoadingStatus }: ReviewProps) {
  const uploadId = upload?.id;
  const [filter, setFilter] = useState("error"); // default value

  const { data, error }: any = useReview(uploadId, filter as any);
  console.log(data);
  const csvData = data?.data?.rows || [];

  const [columnDefs, setColumnDefs] = useState<any>([]);

  const theme = useThemeStore((state) => state.theme);

  // TODO: Carlos - I changed the initial state back here to false, it was set to showImportLoadingStatus causing the review table not to be shown
  const [showLoading, setShowLoading] = useState(false);

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

  // TODO: this filter should be integrated with the backend
  const filterOption = [
    { label: "All (11)", selected: false },
    { label: "Valid (11)", selected: false },
    { label: "Error (0)", selected: false, color: "#f04339" },
  ];
  const [selectedFilter] = filterOption.filter((option) => option.label.toLowerCase().includes(filter));
  if (selectedFilter) selectedFilter.selected = true;
  console.log("selectedFilter", selectedFilter);

  return (
    <>
      {showLoading && showImportLoadingStatus ? (
        <LoadingSpinner style={style} />
      ) : (
        <div className={style.reviewContainer}>
          <ToggleFilter options={filterOption} className={style.filters} onChange={(option: string) => setFilter(option)} />
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
