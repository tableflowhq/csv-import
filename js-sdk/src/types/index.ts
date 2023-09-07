import { CSSProperties } from "react";

export type JSONPrimitive = string | number | boolean | null;
export interface JSONMap extends Record<string, JSONPrimitive | JSONArray | JSONMap> {}
export interface JSONArray extends Array<JSONPrimitive | JSONArray | JSONMap> {}
export type JSONObject = JSONMap | JSONArray;

type ModalParams =
  | {
      isModal: true;
      onRequestClose?: () => void;
      closeOnClickOutside?: boolean;
    }
  | {
      isModal: false;
      onRequestClose: never;
      closeOnClickOutside: never;
    };

export type TableFlowImporterProps = HTMLDialogElement & {
  elementId?: string;
  importerId: string;
  template?: Record<string, unknown> | string;
  hostUrl?: string;
  darkMode?: boolean;
  primaryColor?: string;
  metadata?: Record<string, unknown> | string;
  onComplete?: (data: { data: any; error: any }) => void;
  customStyles?: Record<string, string> | CSSProperties;
  showImportLoadingStatus?: boolean;
  showDownloadTemplateButton?: boolean;
  skipHeaderRowSelection?: boolean;
  cssOverrides?: Record<string, string>;
  schemaless?: boolean;
} & ModalParams;
