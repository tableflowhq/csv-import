import { Upload } from "../../../api/types";

export type DataValidationProps = {
  upload: Upload;
  reload: () => void;
  close: () => void;
  onSuccess: (data: any, error: string | null) => void;
  showImportLoadingStatus?: boolean;
};
