import { Template } from "../../../api/types";

export type UploaderProps = {
  template: Template;
  onSuccess: (tusId: string) => void;
};
