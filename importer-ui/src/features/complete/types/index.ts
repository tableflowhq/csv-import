import { Upload } from "../../../api/types";

export type CompleteProps = {
  reload: () => void;
  close: () => void;
  onSuccess: (data: any, error: string | null) => void;
  upload: Upload;
  showImportLoadingStatus?: boolean;
};
