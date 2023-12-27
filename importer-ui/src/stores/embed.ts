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
  schemalessDataTypes?: boolean;
  showDownloadTemplateButton: boolean;
  customStyles?: string;
  cssOverrides?: string;
};

type ParamsStore = {
  embedParams: EmbedParams;
  setEmbedParams: (embedParams: EmbedParams) => void;
};

const useEmbedStore = create<ParamsStore>((set) => ({
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
    schemalessDataTypes: false,
  },
  setEmbedParams: (embedParams) => {
    const { schemaless, ...params } = embedParams;
    const updatedParams = {
      ...params,
      schemaless,
      schemalessReadOnly: schemaless ? embedParams.schemalessReadOnly : false,
      schemalessDataTypes: schemaless ? embedParams.schemalessDataTypes : false,
    };

    set((state) => ({
      embedParams: {
        ...state.embedParams,
        ...updatedParams,
        importerId: updatedParams.importerId === undefined || updatedParams.importerId?.trim() === "" ? "0" : updatedParams.importerId,
      },
    }));
  },
}));
export default useEmbedStore;
