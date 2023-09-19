import { QueryFilter, Upload } from "../../../api/types";

export type ReviewProps = {
  upload: Upload;
  onCancel: () => void;
  close: () => void;
  onSuccess: (data: any, error: string | null) => void;
  showImportLoadingStatus?: boolean;
};

export type TableProps = {
  cellClickedListener: (event: any) => void;
  theme: "light" | "dark";
  uploadId: string;
  filter: QueryFilter;
};
