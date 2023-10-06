import { Dispatch, SetStateAction } from "react";
import { Template, Upload } from "../../../api/types";

type Include = {
  template: string;
  use: boolean;
};
export interface FormValues {
  [key: string]: Include;
}

export type MapColumnsProps = {
  upload?: Upload;
  template: Template;
  onSuccess: (uploadId: string, columnsValues: any) => void;
  onCancel: () => void;
  showImportLoadingStatus?: boolean;
  skipHeaderRowSelection?: boolean;
  schemaless?: boolean;
  schemalessReadOnly?: boolean;
  seColumnsValues: Dispatch<SetStateAction<FormValues>>;
  columnsValues: FormValues;
};
