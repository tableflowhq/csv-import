import { CellValueChangedEvent } from "ag-grid-community";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Errors, ToggleFilter, useThemeStore } from "@tableflow/ui-library";
import { Option } from "@tableflow/ui-library/build/ToggleFilter/types";
import { post } from "../../api/api";
import { QueryFilter } from "../../api/types";
import usePostReviewEditCell from "../../api/usePostReviewEditCell";
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
  const [cellValueChangedEvent, setCellValueChangedEvent] = useState<CellValueChangedEvent>();
  const [hasDataErrors, setHasDataErrors] = useState(false);
  const { mutate, error: submitError, isSuccess, isLoading: isSubmitting, data: dataSubmitted } = useSubmitReview(uploadId || "");
  const { mutate: postEditCell, error: errorEditCell, data: dataCellEdited } = usePostReviewEditCell(uploadId);
  const theme = useThemeStore((state) => state.theme);
  const [showLoading, setShowLoading] = useState(true);
  const submittedOk = dataSubmitted?.ok || {};
  const hasValidations = template.columns.some((tc) => tc.validations && tc.validations.length > 0);

  const cellValueChangeSet = useRef(new Set<string>());
  const onCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    const { rowIndex, column, data, newValue } = event;
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

    const body = {
      row_index: data?.index,
      cell_key: cellKey,
      cell_value: newValue ?? "",
    };
    setCellValueChangedEvent(event);
    postEditCell({ body });
  }, []);

  useEffect(() => {
    if (!dataCellEdited) return;
    if (!dataCellEdited?.ok) {
      const event = cellValueChangedEvent;
      if (event) {
        const columnId = event.column.getColId();
        const cellId = `${event.rowIndex}-${columnId}`;
        cellValueChangeSet.current.add(cellId);
        const rowNode = event.api?.getRowNode(String(event.rowIndex));
        if (rowNode) {
          rowNode.setDataValue(columnId, event.oldValue);
        } else {
          console.error("Unable to retrieve row node from event API", event.rowIndex);
          alert(errorEditCell);
        }
      }
    } else {
      const { num_rows, num_valid_rows, num_error_rows } = dataCellEdited?.data || {};
      updateFilterOptionCounts(num_rows, num_valid_rows, num_error_rows);
    }
  }, [dataCellEdited, cellValueChangedEvent]);

  useEffect(() => {
    if (isSuccess || submitError) {
      setShowLoading(false);
      onComplete(dataSubmitted?.data);
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

  const updateFilterOptionCounts = (numRows: number, numValidRows: number, numErrorRows: number) => {
    const updatedFilterOptions = [...filterOptions];
    for (const fo of updatedFilterOptions) {
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
    setFilterOptions(updatedFilterOptions);
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
