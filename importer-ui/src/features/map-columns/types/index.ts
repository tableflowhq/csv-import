import { Template, Upload } from "../../../api/types";

export type MapColumnsProps = {
  upload?: Upload;
  template: Template;
  onSuccess: (uploadId: string) => void;
  onCancel: () => void;
  showImportLoadingStatus?: boolean;
  skipHeaderRowSelection?: boolean;
  schemaless?: boolean;
};
