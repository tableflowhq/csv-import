import { Upload } from "../../../api/types";

export type RowSelectionProps = {
  upload?: Upload;
  onSuccess: (upload: any) => void;
  onCancel: () => void;
  selectedHeaderRow: number | null;
  setSelectedHeaderRow: (id: number) => void;
};
