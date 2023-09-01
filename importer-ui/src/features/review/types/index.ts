import { Template, Upload } from "../../../api/types";

export type ReviewProps = {
  upload?: Upload;
  template: Template;
  onSuccess: (uploadId: string) => void;
  onCancel: () => void;
  showImportLoadingStatus?: boolean;
  skipHeaderRowSelection?: boolean;
  schemaless?: boolean;
};
