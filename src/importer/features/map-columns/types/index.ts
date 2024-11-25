import { Template } from "../../../types";
import { FileData } from "../../main/types";

export type TemplateColumnMapping = {
  key: string;
  include: boolean;
  selected?: boolean;
};

export type MapColumnsProps = {
  template: Template;
  data: FileData;
  columnMapping: { [index: number]: TemplateColumnMapping };
  selectedHeaderRow: number | null;
  skipHeaderRowSelection?: boolean;
  saveProperties?: boolean;
  onSuccess: (columnMapping: { [index: number]: TemplateColumnMapping }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
};
