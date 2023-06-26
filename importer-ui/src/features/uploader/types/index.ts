import { Template } from "../../../api/types";

export type UploaderProps = {
  template: Template;
  metadata: string;
  importerId: string;
  endpoint: string;
  onSuccess: (tusId: string) => void;
};
