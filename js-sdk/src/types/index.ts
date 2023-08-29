import { CSSProperties } from "react";

export type JSONPrimitive = string | number | boolean | null;
export interface JSONMap extends Record<string, JSONPrimitive | JSONArray | JSONMap> {}
export interface JSONArray extends Array<JSONPrimitive | JSONArray | JSONMap> {}
export type JSONObject = JSONMap | JSONArray;

export type TableFlowImporterProps = HTMLDialogElement & {
  elementId?: string;
  onRequestClose?: () => void;
  importerId: string;
  template?: JSONObject | string;
  hostUrl?: string;
  darkMode?: boolean;
  primaryColor?: string;
  closeOnClickOutside?: boolean;
  metadata?: JSONObject | string;
  onComplete?: (data: { data: any; error: any }) => void;
  customStyles?: Record<string, string> | CSSProperties;
  showImportLoadingStatus?: boolean;
  skipHeaderRowSelection?: boolean;
};
