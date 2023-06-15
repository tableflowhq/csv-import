import { ReactElement } from "react";

// Custom Routes that are converted to react-router Route elements
export type RoutesType = {
  paths: string[] | string;
  children: ReactElement;
  layout?: any;
  layoutParams?: { [key: string]: any };
}[];
