import { create } from "zustand";

type EmbedParams = {
  importerId: string;
  metadata: string;
  template: string;
  isModal?: boolean;
  modalIsOpen: boolean;
  onComplete: boolean;
  waitOnComplete: boolean;
  showImportLoadingStatus: boolean;
  skipHeaderRowSelection?: boolean;
  schemaless?: boolean;
  schemalessReadOnly?: boolean;
  showDownloadTemplateButton: boolean;
  customStyles?: string;
  cssOverrides?: string;
};

type ParamsStore = {
  embedParams: EmbedParams;
  setEmbedParams: (embedParams: EmbedParams) => void;
};

const useEmbedStore = create<ParamsStore>()((set) => ({
  embedParams: {
    importerId: "",
    metadata: "",
    modalIsOpen: false,
    onComplete: false,
    waitOnComplete: false,
    showImportLoadingStatus: false,
    template: "",
    showDownloadTemplateButton: true,
    customStyles: "",
    cssOverrides: "",
    schemaless: false,
    schemalessReadOnly: false,
  },
  setEmbedParams: (embedParams) =>
    set((state) => ({
      embedParams: {
        ...state.embedParams,
        ...embedParams,
        importerId: embedParams.importerId === undefined || embedParams.importerId?.trim() === "" ? "0" : embedParams.importerId,
      },
    })),
}));

export default useEmbedStore;
