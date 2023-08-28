import { JSXElementConstructor, ReactElement } from "react";


export type Components = {
  [key: string]: () => null | ReactElement<any, string | JSXElementConstructor<any>> | null;
};