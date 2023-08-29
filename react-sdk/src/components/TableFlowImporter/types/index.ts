import { CSSProperties, HTMLAttributes } from "react";

export type JSONPrimitive = string | number | boolean | null;
export interface JSONMap extends Record<string, JSONPrimitive | JSONArray | JSONMap> {}
export interface JSONArray extends Array<JSONPrimitive | JSONArray | JSONMap> {}
export type JSONObject = JSONMap | JSONArray;

export type TableFlowImporterProps = HTMLAttributes<HTMLDialogElement> & {
  isOpen?: boolean;
  onRequestClose?: () => void;
  importerId: string;
  hostUrl?: string;
  template?: JSONObject | string;
  darkMode?: boolean;
  primaryColor?: string;
  closeOnClickOutside?: boolean;
  metadata?: JSONObject | string;
  onComplete?: (data: { data: any; error: any }) => void;
  customStyles?: Record<string, string> | CSSProperties;
  showImportLoadingStatus?: boolean;
  skipHeaderRowSelection?: boolean;
};
