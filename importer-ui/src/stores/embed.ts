import { create } from "zustand";

type EmbedParams = {
  importerId: string;
  metadata: string;
  template: string;
  isModal?: boolean;
  modalIsOpen: boolean;
  onComplete: boolean;
  showImportLoadingStatus: boolean;
  skipHeaderRowSelection?: boolean;
  schemaless?: boolean;
  schemalessReadOnly?: boolean;
  showDownloadTemplateButton: boolean;
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
    showImportLoadingStatus: false,
    template: "",
    showDownloadTemplateButton: true,
    cssOverrides: "",
    schemaless: false,
    schemalessReadOnly: false,
  },
  setEmbedParams: (embedParams) => set({ embedParams }),
}));

export default useEmbedStore;
