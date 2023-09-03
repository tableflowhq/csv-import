import { HTMLAttributes } from "react";

type ModalParams =
  | {
      isModal: true;
      onRequestClose?: () => void;
      closeOnClickOutside?: boolean;
      isOpen?: boolean;
    }
  | {
      isModal: false;
      onRequestClose: never;
      closeOnClickOutside: never;
      isOpen: never;
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
  skipHeaderRowSelection?: boolean;
  cssOverrides?: Record<string, string>;
  schemaless?: boolean;
} & ModalParams;
