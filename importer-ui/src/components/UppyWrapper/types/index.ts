import { Template } from "../../../api/types";
import { UploaderProps } from "../../../features/uploader/types";

export type UppyWrapperProps = Omit<UploaderProps, "template"> & {
  template?: Template;
};
