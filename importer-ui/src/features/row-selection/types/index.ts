import { Upload } from "../../../api/types";

export type RowSelectionProps = {
  upload?: Upload;
  onSuccess: (uploadId: string) => void;
  onCancel: () => void;
};
