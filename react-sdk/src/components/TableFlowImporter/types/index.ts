import { HTMLAttributes } from "react";

type ModalParams =
  | {
      isModal?: true;
      modalIsOpen?: boolean;
      modalOnCloseTriggered?: () => void;
      modalCloseOnOutsideClick?: boolean;
    }
  | {
      isModal: false;
    };

export type TableFlowImporterProps = (HTMLAttributes<HTMLDialogElement> & HTMLAttributes<HTMLDivElement>) & {
  importerId: string;
  hostUrl?: string;
  template?: Record<string, unknown> | string;
  darkMode?: boolean;
  primaryColor?: string;
  metadata?: Record<string, unknown> | string;
  onComplete?: (data: any) => void;
  waitOnComplete?: boolean;
  customStyles?: Record<string, string>;
  showImportLoadingStatus?: boolean;
  showDownloadTemplateButton?: boolean;
  skipHeaderRowSelection?: boolean;
  cssOverrides?: Record<string, string>;
  schemaless?: boolean;
  schemalessReadOnly?: boolean;
} & ModalParams;
