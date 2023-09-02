import { useMemo } from "react";
import { Importer, Template, Upload } from "../../../api/types";
import useGetImporter from "../../../api/useGetImporter";
import useGetUpload from "../../../api/useGetUpload";
import useMutableLocalStorage from "./useMutableLocalStorage";

export default function useApi(importerId: string, sdkDefinedTemplate: string, schemaless?: boolean) {
  const [tusId, setTusId] = useMutableLocalStorage(importerId + "-tusId", "");

  const tusWasStored = useMemo(() => !!tusId, []);

  // Load importer & template for the first step
  const {
    data: importer = {} as Importer,
    isLoading: importerIsLoading,
    error: importerError,
  } = useGetImporter(importerId, sdkDefinedTemplate, schemaless);
  const { template = {} as Template } = importer;

  // Load upload for the second step
  const { data: upload = {} as Upload, error: uploadError } = useGetUpload(tusId);
  const { is_stored: isStored } = upload;

  if (importer?.template?.is_sdk_defined && upload?.is_stored && upload?.template) {
    importer.template = upload.template;
  }

  return {
    tusId,
    tusWasStored,
    importer,
    importerIsLoading,
    importerError,
    template,
    upload,
    uploadError,
    isStored,
    setTusId,
  };
}
