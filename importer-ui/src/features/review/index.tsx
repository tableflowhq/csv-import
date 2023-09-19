import { ColDef, ICellRendererParams } from "ag-grid-community";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Icon, ToggleFilter, useThemeStore } from "@tableflow/ui-library";
import { QueryFilter } from "../../api/types";
import useGetRows from "../../api/useGetRows";
import useReview from "../../api/useReview";
import LoadingSpinner from "./components/LoadingSpinner";
import ReviewDataTable from "./components/ReviewDataTable";
import { ReviewProps } from "./types";
import style from "./style/Review.module.scss";

const defaultOptions = [
  { label: "All (0)", selected: false },
  { label: "Valid (0)", selected: false },
  { label: "Error (0)", selected: false, color: "#f04339" },
];

export default function Review({ onCancel, onSuccess, upload, showImportLoadingStatus }: ReviewProps) {
  const uploadId = upload?.id;
  const [filter, setFilter] = useState<QueryFilter>("all"); // default value
  const [filterOptions, setFilterOptions] = useState(defaultOptions);

  const { data, error, isLoading }: any = useReview(uploadId);
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
  }, [csvData]);

  // useEffect(() => {
  //   if (isStored || error) {
  //     setShowLoading(false);
  //     onSuccess(data, data?.error || error?.toString() || null);
  //   }
  // }, [isStored, error]);

  useEffect(() => {
    // Sets the filters
    const [all, valid, error] = defaultOptions;
    all.label = `All (${data?.num_rows})`;
    valid.label = `Valid (${data?.num_valid_rows})`;
    error.label = `Error (${data?.num_error_rows})`;
    const [selectedFilter] = defaultOptions.filter((option) => option.label.toLowerCase().includes(filter));
    if (selectedFilter) selectedFilter.selected = true;
    setFilterOptions([...filterOptions]);
  }, [data]);

  const onFilterChange = useCallback((option: string) => {
    // TODO: this regex might not be necessary if we use a separate property for values in the filter component
    const match = option.match(/^(\w+)(?=\s\(\d+\))/);
    match && setFilter(match[1].toLowerCase() as QueryFilter);
  }, []);

  return (
    <>
      {showLoading && showImportLoadingStatus ? (
        <LoadingSpinner style={style} />
      ) : (
        <div className={style.reviewContainer}>
          <ToggleFilter options={filterOptions} className={style.filters} onChange={(option: string) => onFilterChange(option)} />
          <div className={style.tableWrapper}>
            <ReviewDataTable
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              cellClickedListener={cellClickedListener}
              theme={theme}
              uploadId={uploadId}
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
