import { Template } from "../../../api/types";

export type UploaderProps = {
  template: Template;
  metadata: string;
  importerId: string;
  skipHeaderRowSelection: boolean;
  endpoint: string;
  onSuccess: (tusId: string) => void;
  schemaless?: boolean;
  showDownloadTemplateButton?: boolean;
};
