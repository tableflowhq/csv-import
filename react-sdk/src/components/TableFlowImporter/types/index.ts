import { HTMLAttributes } from "react";

type ModalParams =
  | {
      isModal: true;
      modalIsOpen?: boolean;
      modalOnCloseTriggered?: () => void;
      modalCloseOnOutsideClick?: boolean;
    }
  | {
      isModal: false;
      modalIsOpen: never;
      modalOnCloseTriggered: never;
      modalCloseOnOutsideClick: never;
    };

export type TableFlowImporterProps = (HTMLAttributes<HTMLDialogElement> & HTMLAttributes<HTMLDivElement>) & {
  importerId: string;
  hostUrl?: string;
  template?: Record<string, unknown> | string;
  darkMode?: boolean;
  primaryColor?: string;
  metadata?: Record<string, unknown> | string;
  onComplete?: (data: { data: any; error: any }) => void;
  customStyles?: Record<string, string>;
  showImportLoadingStatus?: boolean;
  showDownloadTemplateButton?: boolean;
  skipHeaderRowSelection?: boolean;
  cssOverrides?: Record<string, string>;
  schemaless?: boolean;
} & ModalParams;
