import { create } from "zustand";

type EmbedParams = { importerId: string; metadata: string; isOpen: boolean; onComplete: boolean };

type ParamsStore = {
  embedParams: EmbedParams;
  setEmbedParams: (embedParams: EmbedParams) => void;
};

const useEmbedStore = create<ParamsStore>()((set) => ({
  embedParams: { importerId: "", metadata: "{}", isOpen: false, onComplete: false },
  setEmbedParams: (embedParams) => set({ embedParams }),
}));

export default useEmbedStore;
