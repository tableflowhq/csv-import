import { ButtonProps } from "../../Button/types";

export type DialogItem = ButtonProps & {
  action?: Function;
  id?: string;
  active?: boolean;
};

export type DialogProps = ButtonProps & {
  items: DialogItem[];
  dialogPosition?: "left" | "right";
  useActiveAsLabel?: boolean;
};
