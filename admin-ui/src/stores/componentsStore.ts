import { create } from "zustand";
import { Components } from "./types";
import components from "./components";

type ComponentsStore = {
  components: Components;
  setComponents: (components: Components) => void;
};

const useComponentsStore = create<ComponentsStore>((set) => ({
  components,
  setComponents: (newComponents) => {
    return set({ components: { ...components, ...newComponents } });
  },
}));

export default useComponentsStore;
