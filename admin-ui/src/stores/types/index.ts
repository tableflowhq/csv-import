import { JSXElementConstructor, ReactElement } from "react";

export type Components = {
  [key: string]: () => ReactElement<any, string | JSXElementConstructor<any>> | null;
};
