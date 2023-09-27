import { CellValueChangedEvent } from "ag-grid-community";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Errors, ToggleFilter, useThemeStore } from "@tableflow/ui-library";
import { Option } from "@tableflow/ui-library/build/ToggleFilter/types";
import { post } from "../../api/api";
import { QueryFilter } from "../../api/types";
import useReview from "../../api/useReview";
import useSubmitReview from "../../api/useSubmitReview";
import LoadingSpinner from "./components/LoadingSpinner";
import ReviewDataTable from "./components/ReviewDataTable";
import { ReviewProps } from "./types";
import style from "./style/Review.module.scss";
import Complete from "../complete";

const defaultOptions: Option[] = [
  { label: "All (0)", filterValue: "all", selected: true },
  { label: "Valid (0)", filterValue: "valid", selected: false },
  { label: "Error (0)", filterValue: "error", selected: false, color: "#f04339" },
];

export default function Review({ onCancel, onComplete, upload, template, reload, close }: ReviewProps) {
  const uploadId = upload?.id;
  const filter = useRef<QueryFilter>("all");
  const [filterOptions, setFilterOptions] = useState<Option[]>(defaultOptions);
  const [isSubmitCompleted, setIsSubmitCompleted] = useState(false);
  const { data, isLoading }: any = useReview(uploadId, {
    staleTime: 0,
  });
  const { mutate, error: submitError, isSuccess, isLoading: isSubmitting, data: dataSubmitted } = useSubmitReview(uploadId || "");

  const theme = useThemeStore((state) => state.theme);
  const [showLoading, setShowLoading] = useState(true);
  const submittedOk = dataSubmitted?.ok || {};
  const hasValidations = template.columns.some((tc) => tc.validations && tc.validations.length > 0);

  const cellValueChangeSet = useRef(new Set<string>());
  const onCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    const columnId = event.column.getColId();
    const cellId = `${event.rowIndex}-${columnId}`;
    // Check if the change was done programmatically to not cause an infinite loop when reverting changes to cell edits
    if (cellValueChangeSet.current.has(cellId)) {
      cellValueChangeSet.current.delete(cellId);
      return;
    }
    let cellKey = "";
    const parts = columnId.split(".");
    if (parts.length > 1 && parts[0] === "values") {
      cellKey = parts[1];
    } else {
      console.error("Unexpected column ID format", columnId);
      return;
    }
    const endpoint = `import/${uploadId}/cell/edit`;
    const body = {
      row_index: event.data?.index,
      is_error: !!event.data?.errors && typeof event.data?.errors[cellKey] !== "undefined",
      cell_key: cellKey,
      cell_value: event.newValue,
    };
    post(endpoint, body).then((res) => {
      if (!res.ok) {
        cellValueChangeSet.current.add(cellId);
        const rowNode = event.api?.getRowNode(String(event.rowIndex));
        if (rowNode) {
          rowNode.setDataValue(columnId, event.oldValue);
        } else {
          console.error("Unable to retrieve row node from event API", event.rowIndex);
        }
        alert(res.error);
      } else {
        updateFilterOptionCounts(res.data?.num_rows, res.data?.num_valid_rows, res.data?.num_error_rows);
      }
    });
  }, []);

  useEffect(() => {
    if (isSuccess || submitError) {
      setShowLoading(false);
      onComplete(dataSubmitted, dataSubmitted?.error || submitError?.toString() || null);
    }
  }, [isSuccess, submitError]);

  useEffect(() => {
    updateFilterOptionCounts(data?.num_rows, data?.num_valid_rows, data?.num_error_rows);
    if (data?.is_stored) {
      setShowLoading(false);
    }
  }, [JSON.stringify(data)]);

  const onFilterChange = useCallback((option: string) => {
    filter.current = option as QueryFilter;
    setFilterOptions(
      filterOptions.map((fo) => {
        fo.selected = fo.filterValue === option;
        return fo;
      })
    );
  }, []);

  const updateFilterOptionCounts = (numRows: number, numValidRows: number, numErrorRows: number) => {
    for (const fo of filterOptions) {
      switch (fo.filterValue) {
        case "all":
          fo.label = `All ${numRows}`;
          break;
        case "valid":
          fo.label = `Valid ${numValidRows}`;
          break;
        case "error":
          fo.label = `Error ${numErrorRows}`;
          break;
      }
    }
    // TODO: Works only after clicking filter options
    setFilterOptions(filterOptions);
  };

  const handleSubmitClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    mutate({ uploadId: uploadId });
    if (submittedOk && !submitError && !isSubmitting) {
      setIsSubmitCompleted(true);
    }
  };

  if (isSubmitCompleted) {
    return <Complete reload={reload} close={close} upload={upload} showImportLoadingStatus={false} />;
  }

  if (showLoading || isSubmitting) {
    return <LoadingSpinner style={style} />;
  }

  return (
    <div>
      <div className={style.reviewContainer}>
        {hasValidations && <ToggleFilter options={filterOptions} className={style.filters} onChange={(option: string) => onFilterChange(option)} />}
        <div className={style.tableWrapper}>
          {!isLoading && (
            <ReviewDataTable onCellValueChanged={onCellValueChanged} template={template} theme={theme} uploadId={uploadId} filter={filter.current} />
          )}
        </div>
        <div className={style.actions}>
          <Button type="button" variants={["secondary"]} onClick={onCancel}>
            Back
          </Button>
          <Button variants={["primary"]} disabled={data?.num_error_rows > 0} onClick={handleSubmitClick}>
            Submit
          </Button>
        </div>
      </div>
      {!isLoading && !!submitError && (
        <div className={style.errorContainer}>
          <Errors error={submitError} />
        </div>
      )}
    </div>
  );
}
