import { useLocalStorage } from "@tableflow/ui-library";
import { Importer, Template, Upload } from "../../../api/types";
import useGetImporter from "../../../api/useGetImporter";
import useGetUpload from "../../../api/useGetUpload";

export default function useApi(importerId: string) {
  const [tusId, setTusId] = useLocalStorage("tusId", "");

  // Load importer & template for the first step
  const { data: importer = {} as Importer, isLoading: isLoadingImporter, error: importerError } = useGetImporter(importerId);
  const { template = {} as Template } = importer;

  // Load upload for the second step
  const { data: upload = {} as Upload, error: uploadError } = useGetUpload(tusId);
  const { is_parsed: isParsed } = upload;

  return { tusId, importer, isLoadingImporter, importerError, template, upload, uploadError, isParsed, setTusId };
}
