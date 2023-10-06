import { CellValueChangedEvent } from "ag-grid-community";
import { QueryFilter, Template, Upload } from "../../../api/types";

export type ReviewProps = {
  upload: Upload;
  onCancel: () => void;
  close: () => void;
  onComplete: (data: any) => void;
  showImportLoadingStatus?: boolean;
  template: Template;
  reload: () => void;
  columnsOrder?: ColumnsOrder;
};

export type TableProps = {
  theme: "light" | "dark";
  uploadId: string;
  filter: QueryFilter;
  template: Template;
  onCellValueChanged: (event: CellValueChangedEvent) => void;
  columnsOrder?: ColumnsOrder;
};

export interface ColumnsOrder {
  [key: string]: string;
}
