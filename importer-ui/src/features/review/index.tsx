import { useCallback, useEffect, useState } from "react";
import { Button, Errors, ToggleFilter, useThemeStore } from "@tableflow/ui-library";
import { Option } from "@tableflow/ui-library/build/ToggleFilter/types";
import { QueryFilter } from "../../api/types";
import useReview from "../../api/useReview";
import useSubmitReview from "../../api/useSubmitReview";
import LoadingSpinner from "./components/LoadingSpinner";
import ReviewDataTable from "./components/ReviewDataTable";
import { ReviewProps } from "./types";
import style from "./style/Review.module.scss";
import Complete from "../complete";

const defaultOptions: Option[] = [
  { label: "All (0)", filterValue: "all", selected: false },
  { label: "Valid (0)", filterValue: "valid", selected: false },
  { label: "Error (0)", filterValue: "error", selected: false, color: "#f04339" },
];

export default function Review({ onCancel, onComplete, upload, template, reload, close }: ReviewProps) {
  const uploadId = upload?.id;
  const [filter, setFilter] = useState<QueryFilter>("all");
  const [filterOptions, setFilterOptions] = useState<Option[]>(defaultOptions);
  const [isSubmitCompleted, setIsSubmitCompleted] = useState(false);
  const { data, isLoading }: any = useReview(uploadId, {
    staleTime: 0,
  });
  const { mutate, error: submitError, isSuccess, isLoading: isSubmitting, data: dataSubmitted } = useSubmitReview(uploadId || "");

  const theme = useThemeStore((state) => state.theme);
  const [showLoading, setShowLoading] = useState(true);
  const submittedOk = dataSubmitted?.ok || {};

  useEffect(() => {
    if (isSuccess || submitError) {
      setShowLoading(false);
      onComplete(dataSubmitted, dataSubmitted?.error || submitError?.toString() || null);
    }
  }, [isSuccess, submitError]);

  useEffect(() => {
    // Sets the filters
    const [all, valid, error] = defaultOptions;
    all.label = `All ${data?.num_rows}`;
    valid.label = `Valid ${data?.num_valid_rows}`;
    error.label = `Error ${data?.num_error_rows}`;
    const [selectedFilter] = defaultOptions.filter((option) => option.filterValue === filter);
    if (selectedFilter) selectedFilter.selected = true;
    setFilterOptions([...filterOptions]);
    if (data?.is_stored) {
      setShowLoading(false);
    }
  }, [JSON.stringify(data)]);

  const onFilterChange = useCallback((option: string) => {
    setFilter(option as QueryFilter);
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
        <ToggleFilter options={filterOptions} className={style.filters} onChange={(option: string) => onFilterChange(option)} />
        <div className={style.tableWrapper}>
          {!isLoading && <ReviewDataTable template={template} theme={theme} uploadId={uploadId} filter={filter} />}
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
