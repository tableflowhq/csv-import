import { Upload } from "../../../api/types";

export type RowSelectionProps = {
  upload?: Upload;
  onSuccess: (uploadColumns: any) => void;
  onCancel: () => void;
  selectedRow: number;
  setSelectedRow: (id: number) => void;
};
