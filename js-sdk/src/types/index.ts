import { CSSProperties } from "react";

type ModalParams =
  | {
      isModal?: true;
      modalOnCloseTriggered?: () => void;
      modalCloseOnOutsideClick?: boolean;
    }
  | {
      isModal: false;
      modalOnCloseTriggered: never;
      modalCloseOnOutsideClick: never;
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
