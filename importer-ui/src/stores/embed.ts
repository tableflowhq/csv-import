import { create } from "zustand";

type EmbedParams = Record<"importerId" | "metadata", string>;

type ParamsStore = {
  embedParams: EmbedParams;
  setEmbedParams: (embedParams: EmbedParams) => void;
};

const useEmbedStore = create<ParamsStore>()((set) => ({
  embedParams: { importerId: "", metadata: "{}" },
  setEmbedParams: (embedParams) => set({ embedParams }),
}));

export default useEmbedStore;
