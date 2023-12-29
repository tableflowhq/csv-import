import { Upload } from "../../../api/types";

export type CompleteProps = {
  reload: () => void;
  close: () => void;
  upload: Upload;
  showImportLoadingStatus?: boolean;
};
