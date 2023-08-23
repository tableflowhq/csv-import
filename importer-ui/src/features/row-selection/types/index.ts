import { Upload } from "../../../api/types";

export type RowSelectionProps = {
  upload?: Upload;
  onSuccess: (uploadColumns: any) => void;
  onCancel: () => void;
  selectedId: string | null;
  setSelectedId: (id: string) => void;
};
