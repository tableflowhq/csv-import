import { CSSProperties } from "react";

export type TableFlowImporterProps = HTMLDialogElement & {
  elementId?: string;
  isOpen?: boolean;
  onRequestClose?: () => void;
  importerId: string;
  hostUrl?: string;
  darkMode?: boolean;
  primaryColor?: string;
  closeOnClickOutside?: boolean;
  metadata?: string;
  onComplete?: (data: { data: any; error: any }) => void;
  customStyles?: Record<string, string> | CSSProperties;
  showImportLoadingStatus?: boolean;
};
