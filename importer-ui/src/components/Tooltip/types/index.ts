import { ReactNode } from "react";

export type AsMap = {
  div: React.HTMLProps<HTMLDivElement>;
  span: React.HTMLProps<HTMLSpanElement>;
  p: React.HTMLProps<HTMLParagraphElement>;
};

export type TooltipProps<T extends keyof AsMap = "span"> = {
  as?: T;
  title?: string | ReactNode;
  icon?: ReactNode;
} & AsMap[T];
