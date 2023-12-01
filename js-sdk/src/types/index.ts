type ModalParams = {
  isModal?: boolean;
  modalOnCloseTriggered?: () => void;
  modalCloseOnOutsideClick?: boolean;
};

export type TableFlowImporterProps = HTMLDialogElement & {
  elementId?: string;
  importerId?: string;
  template?: Record<string, unknown> | string;
  hostUrl?: string;
  darkMode?: boolean;
  primaryColor?: string;
  metadata?: Record<string, unknown> | string;
  onComplete?: (data: any) => void;
  waitOnComplete?: boolean;
  customStyles?: Record<string, string> | string;
  cssOverrides?: Record<string, string> | string;
  showImportLoadingStatus?: boolean;
  showDownloadTemplateButton?: boolean;
  skipHeaderRowSelection?: boolean;
  schemaless?: boolean;
  schemalessReadOnly?: boolean;
} & ModalParams;
