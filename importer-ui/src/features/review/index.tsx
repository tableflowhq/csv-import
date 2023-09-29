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

type FilterOptionCounts = {
  NumRows: number;
  NumValidRows: number;
  NumErrorRows: number;
};

export default function Review({ onCancel, onComplete, upload, template, reload, close }: ReviewProps) {
  const uploadId = upload?.id;
  const filter = useRef<QueryFilter>("all");
  const [filterOptions, setFilterOptions] = useState<Option[]>(defaultOptions);
  const [isSubmitCompleted, setIsSubmitCompleted] = useState(false);
  const { data, isLoading }: any = useReview(uploadId, {
    staleTime: 0,
  });
  const [hasDataErrors, setHasDataErrors] = useState(false);
  const { mutate, error: submitError, isSuccess, isLoading: isSubmitting, data: dataSubmitted } = useSubmitReview(uploadId || "");
  const theme = useThemeStore((state) => state.theme);
  const [showLoading, setShowLoading] = useState(true);
  const submittedOk = dataSubmitted?.ok || {};
  const hasValidations = template.columns.some((tc) => tc.validations && tc.validations.length > 0);

  const cellValueChangeSet = useRef(new Set<string>());
  const onCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    const { rowIndex, column, data, newValue, oldValue, api } = event;
    const columnId = column.getColId();
    const cellId = `${rowIndex}-${columnId}`;

    // Check if the change was done programmatically to not cause an infinite loop when reverting changes to cell edits
    if (cellValueChangeSet.current.has(cellId)) {
      cellValueChangeSet.current.delete(cellId);
      return;
    }

    // Extract the cell key from column ID
    const parts = columnId.split(".");
    let cellKey = "";
    if (parts.length > 1 && parts[0] === "values") {
      cellKey = parts[1];
    } else {
      console.error("Unexpected column ID format", columnId);
      return;
    }

    const endpoint = `import/${uploadId}/cell/edit`;
    const body = {
      row_index: data?.index,
      cell_key: cellKey,
      cell_value: newValue ?? "",
    };
    post(endpoint, body).then((res) => {
      const rowNode = api?.getRowNode(String(rowIndex));
      if (!rowNode) {
        console.error("Unable to retrieve row node from event API", rowIndex);
        return;
      }
      if (!res.ok) {
        cellValueChangeSet.current.add(cellId);
        rowNode.setDataValue(columnId, oldValue);
        alert(res.error);
        return;
      }

      if (res.data?.row?.errors && res.data.row.errors[cellKey]) {
        // The edit caused a validation error, update the row node errors
        rowNode.data.errors = rowNode.data.errors || {};
        rowNode.data.errors[cellKey] = res.data.row.errors[cellKey];
      } else if (data?.errors && rowNode.data?.errors[cellKey]) {
        // The edit passed validations, remove the error from the row node
        delete rowNode.data.errors[cellKey];
        if (Object.keys(rowNode.data.errors).length === 0) {
          rowNode.data.errors = undefined;
        }
      }

      // Refresh the row to update the styling
      api?.refreshCells({ rowNodes: [rowNode], columns: [columnId], force: true });

      // Update the has data errors state
      setHasDataErrors(res.data?.num_error_rows > 0);

      // Update the counts on the filter options
      updateFilterOptions(
        filter.current,
        res.data ? { NumRows: res.data.num_rows, NumValidRows: res.data.num_valid_rows, NumErrorRows: res.data.num_error_rows } : undefined
      );
    });
  }, []);

  useEffect(() => {
    if (isSuccess || submitError) {
      setShowLoading(false);
      onComplete(dataSubmitted);
    }
  }, [isSuccess, submitError]);

  // Load the initial state from the data returned
  useEffect(() => {
    updateFilterOptions(
      filter.current,
      data ? { NumRows: data?.num_rows, NumValidRows: data?.num_valid_rows, NumErrorRows: data?.num_error_rows } : undefined
    );
    if (data) {
      setHasDataErrors(data?.num_error_rows > 0);
      if (data?.is_stored) {
        setShowLoading(false);
      }
    }
  }, [JSON.stringify(data)]);

  const updateFilterOptions = useCallback((option: string, counts?: FilterOptionCounts) => {
    filter.current = option as QueryFilter;
    setFilterOptions(
      filterOptions.map((fo) => {
        fo.selected = fo.filterValue === option;
        if (counts) {
          switch (fo.filterValue) {
            case "all":
              fo.label = `All ${counts.NumRows}`;
              break;
            case "valid":
              fo.label = `Valid ${counts.NumValidRows}`;
              break;
            case "error":
              fo.label = `Error ${counts.NumErrorRows}`;
              break;
          }
        }
        return fo;
      })
    );
  }, []);

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
        {hasValidations && (
          <ToggleFilter options={filterOptions} className={style.filters} onChange={(option: string) => updateFilterOptions(option)} />
        )}
        <div className={style.tableWrapper}>
          {!isLoading && (
            <ReviewDataTable onCellValueChanged={onCellValueChanged} template={template} theme={theme} uploadId={uploadId} filter={filter.current} />
          )}
        </div>
        <div className={style.actions}>
          <Button type="button" variants={["secondary"]} onClick={onCancel}>
            Back
          </Button>
          <Button
            title={hasDataErrors ? "Please resolve all errors before submitting" : ""}
            variants={["primary"]}
            disabled={hasDataErrors}
            onClick={handleSubmitClick}>
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
