import { useState, useMemo } from "react";
import useGetImporterMock from "../../../api/useGetImporterMock";
import { Importer, Template, Upload } from "../../../api/types";
import useGetOrganizationMock from "../../../api/useGetOrganizationMock";
import useGetUploadMock from "../../../api/useGetUploadMock";

const mockUseReview = (uploadId: string, enabledReview: boolean, options: any) => {
  return {
    data: { },
    isLoading: false,
    isFetching: false,
    error: null,
  };
};

const mockUseMutableLocalStorage = (key: string, initialValue: any) => {
  const [value, setValue] = useState(initialValue);
  return [value, setValue];
};

export default function useApiMock(importerId: string, sdkDefinedTemplate: string, checkOrganizationStatus: boolean, schemaless?: boolean) {
  const [tusId, setTusId] = mockUseMutableLocalStorage(importerId + "-tusId", "");
  const tusWasStored = useMemo(() => !!tusId, [tusId]);
  const [enabledReview, setEnabledReview] = useState(false);

  const {
    data: importer = {} as Importer,
    isLoading: importerIsLoading,
    error: importerError,
  } = useGetImporterMock(importerId, sdkDefinedTemplate, schemaless);
  const { template = {} as Template } = importer;

  const {
    data: organizationStatus,
    isLoading: statusIsLoading,
  } = useGetOrganizationMock(importerId, checkOrganizationStatus);

  const {
    data: upload = {} as Upload,
    isLoading: uploadIsLoading,
    error: uploadError = {} as any,
  } = useGetUploadMock(tusId);

  const uploadIsStored = upload?.is_stored || false;
  const uploadId = upload?.id || "";

  const {
    data: review,
    isLoading: reviewIsLoading,
    isFetching: reviewIsFetching,
    error: reviewError,
  } = mockUseReview(uploadId, !!uploadId && enabledReview, {
    staleTime: 0,
  });

  const reviewIsStored = enabledReview;

  return {
    tusId,
    setTusId,
    tusWasStored,
    importer,
    importerIsLoading,
    importerError,
    organizationStatus,
    statusIsLoading,
    upload,
    uploadIsLoading,
    template,
    uploadError,
    uploadIsStored,
    review,
    reviewIsLoading: reviewIsLoading || reviewIsFetching,
    reviewError,
    reviewIsStored,
    enabledReview,
    setEnabledReview,
  };
}
