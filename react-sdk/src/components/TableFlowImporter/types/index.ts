import { CSSProperties, HTMLAttributes } from "react";

export type TableFlowImporterProps = HTMLAttributes<HTMLDialogElement> & {
  isOpen?: boolean;
  onRequestClose?: () => void;
  importerId: string;
  hostUrl?: string;
  template?: Record<string, unknown> | string;
  darkMode?: boolean;
  primaryColor?: string;
  closeOnClickOutside?: boolean;
  metadata?: Record<string, unknown> | string;
  onComplete?: (data: { data: any; error: any }) => void;
  customStyles?: Record<string, string> | CSSProperties;
  showImportLoadingStatus?: boolean;
  skipHeaderRowSelection?: boolean;
  schemaless?: boolean;
};
