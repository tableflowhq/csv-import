import { Upload } from "../../../api/types";

export type DataValidationProps = {
  upload: Upload;
  onCancel: () => void;
};
