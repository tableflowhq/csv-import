import { Upload } from "../../../api/types";

export type RowSelectionProps = {
  upload?: Upload;
  onSuccess: (upload: any) => void;
  onCancel: () => void;
  selectedHeaderRow: number;
  setSelectedHeaderRow: (id: number) => void;
};
