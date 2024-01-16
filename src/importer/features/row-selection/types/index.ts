import { FileData } from "../../main/types";

export type RowSelectionProps = {
  data: FileData;
  onSuccess: () => void;
  onCancel: () => void;
  selectedHeaderRow: number | null;
  setSelectedHeaderRow: (id: number) => void;
};
