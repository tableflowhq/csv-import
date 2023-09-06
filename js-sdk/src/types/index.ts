import { CSSProperties } from "react";

export type TableFlowImporterProps = HTMLDialogElement & {
  elementId?: string;
  onRequestClose?: () => void;
  importerId: string;
  template?: Record<string, unknown> | string;
  hostUrl?: string;
  darkMode?: boolean;
  primaryColor?: string;
  closeOnClickOutside?: boolean;
  metadata?: Record<string, unknown> | string;
  onComplete?: (data: { data: any; error: any }) => void;
  customStyles?: Record<string, string> | CSSProperties;
  showImportLoadingStatus?: boolean;
  showDownloadTemplateButton?: boolean;
  skipHeaderRowSelection?: boolean;
  schemaless?: boolean;
};
