import { useMemo } from "react";
import { Importer, Organization, Template, Upload } from "../../../api/types";
import useGetImporter from "../../../api/useGetImporter";
import useGetOrganization from "../../../api/useGetOrganization";
import useGetUpload from "../../../api/useGetUpload";
import useMutableLocalStorage from "./useMutableLocalStorage";

export default function useApi(importerId: string, sdkDefinedTemplate: string, checkOrganizationStatus: boolean, schemaless?: boolean) {
  const [tusId, setTusId] = useMutableLocalStorage(importerId + "-tusId", "");
  const tusWasStored = useMemo(() => !!tusId, []);

  // Load importer & template for the first step
  const {
    data: importer = {} as Importer,
    isLoading: importerIsLoading,
    error: importerError,
  } = useGetImporter(importerId, sdkDefinedTemplate, schemaless);
  const { template = {} as Template } = importer;

  const { data: organization, isLoading: statusIsLoading = {} as Organization } = useGetOrganization(importerId, checkOrganizationStatus);
  const organizationStatus = organization?.status || false;

  // Load upload for the second step
  const { data: upload = {} as Upload, isLoading: uploadIsLoading, error: uploadError } = useGetUpload(tusId);
  const { is_stored: uploadIsStored } = upload;

  if (importer?.template?.is_sdk_defined && upload?.is_stored && upload?.template) {
    importer.template = upload.template;
  }

  return {
    tusId,
    setTusId,
    tusWasStored,
    importer,
    importerIsLoading,
    importerError,
    organizationStatus,
    statusIsLoading,
    template,
    upload,
    uploadIsLoading,
    uploadError,
    uploadIsStored,
  };
}
