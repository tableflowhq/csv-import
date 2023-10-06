import { ButtonHTMLAttributes } from "react";
import { IconType } from "../../Icon/types";

export type buttonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "warning"
  | "bare"
  | "small"
  | "square"
  | "fullWidth"
  | "noMargin"
  | "sort"
  | "sortUp"
  | "sortDown"
  | "alignLeft"
  | "alignRight"
  | "noFill";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variants?: buttonVariant[];
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
};

export const buttonVariants = [
  "primary",
  "secondary",
  "tertiary",
  "warning",
  "bare",
  "small",
  "square",
  "fullWidth",
  "noMargin",
  "sort",
  "sortUp",
  "sortDown",
  "alignLeft",
  "alignRight",
  "noFill",
];
