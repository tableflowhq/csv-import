import { create } from "zustand";

type EmbedParams = {
  importerId: string;
  metadata: string;
  template: string;
  isOpen: boolean;
  onComplete: boolean;
  showImportLoadingStatus: boolean;
  skipHeaderRowSelection: boolean;
};

type ParamsStore = {
  embedParams: EmbedParams;
  setEmbedParams: (embedParams: EmbedParams) => void;
};

const useEmbedStore = create<ParamsStore>()((set) => ({
  embedParams: {
    importerId: "",
    metadata: "{}",
    isOpen: false,
    onComplete: false,
    showImportLoadingStatus: false,
    skipHeaderRowSelection: false,
    template: "",
  },
  setEmbedParams: (embedParams) => set({ embedParams }),
}));

export default useEmbedStore;
