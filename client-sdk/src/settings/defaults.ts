import { TableFlowImporterProps } from "../types";

const defaults: TableFlowImporterProps = {
  template: {
    columns: [
      {
        name: "First Name",
        key: "first_name",
        required: true,
        description: "The first name of the user",
        suggested_mappings: ["first", "mame"],
      },
      {
        name: "Last Name",
        suggested_mappings: ["last"],
      },
      {
        name: "Email",
        required: true,
        description: "The email of the user",
      },
    ],
  },
  darkMode: true,
  onComplete: (data) => console.log("onComplete", data),
  // customStyles: {
  //   "font-family": "cursive",
  //   "font-size": "15px",
  //   "base-spacing": "2rem",
  //   "border-radius": "8px",
  //   "color-primary": "salmon",
  //   "color-primary-hover": "crimson",
  //   "color-secondary": "indianRed",
  //   "color-secondary-hover": "crimson",
  //   "color-tertiary": "indianRed",
  //   "color-tertiary-hover": "crimson",
  //   "color-text-on-primary": "#fff",
  //   "color-text-on-secondary": "#ffffff",
  //   "color-background": "bisque",
  //   "color-background-modal": "blanchedAlmond",
  //   "color-text": "brown",
  //   "color-text-soft": "rgba(165, 42, 42, .5)",
  //   "importer-link": "indigo",
  //   "color-border": "lightCoral",
  //   "color-input-background": "blanchedAlmond",
  //   "color-input-background-soft": "white",
  //   "color-background-menu-hover": "bisque",
  //   "color-green-ui": "darkGreen",
  // },
  isModal: true,
  modalCloseOnOutsideClick: true,
};

export default defaults;
