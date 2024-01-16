import { Template } from "../../../types";
import { Dispatch, SetStateAction } from "react";

export type UploaderProps = {
  template: Template;
  skipHeaderRowSelection: boolean;
  onSuccess: (file: File) => void;
  showDownloadTemplateButton?: boolean;
  setDataError: Dispatch<SetStateAction<string | null>>;
};
