import { FormProps } from "../../types";

export type InviteProps = FormProps & {
  disableSkip?: boolean;
  disableIntro?: boolean;
  confirmLabel?: string;
};
