import { create } from "zustand";

type EmbedParams = {
  importerId: string;
  metadata: string;
  template: string;
  isOpen: boolean;
  onComplete: boolean;
  showImportLoadingStatus: boolean;
  skipHeaderRowSelection?: boolean;
  isModal?: boolean;
  schemaless?: boolean;
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
    isOpen: false,
    onComplete: false,
    showImportLoadingStatus: false,
    template: "",
    showDownloadTemplateButton: true,
    isModal: true,
    cssOverrides: "",
  },
  setEmbedParams: (embedParams) => set({ embedParams }),
}));

export default useEmbedStore;
