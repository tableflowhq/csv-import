import { create } from "zustand";
import { Anchors } from "./types";
import anchors from "./widgets";

type AnchorsStore = {
  anchors: Anchors;
  setAnchors: (anchors: Anchors) => void;
};

const useAnchorsStore = create<AnchorsStore>((set) => ({
  anchors,
  setAnchors: (anchors) => set({ anchors }),
}));

export default useAnchorsStore;
