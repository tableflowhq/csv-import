import { ReactNode } from "react";
import { IconType } from "../../Icon/types";

export type AsMap = {
  div: React.HTMLProps<HTMLDivElement>;
  span: React.HTMLProps<HTMLSpanElement>;
  p: React.HTMLProps<HTMLParagraphElement>;
};

export type TooltipProps<T extends keyof AsMap = "span"> = {
  as?: T;
  title?: string | ReactNode;
  icon?: IconType;
} & AsMap[T];
