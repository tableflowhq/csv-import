import { Meta, StoryObj } from "@storybook/html";
import createTableFlowImporter from ".";
import { TableFlowImporterProps } from "./types";

let dialog: any;

const meta = {
  title: "App",
  render: (args) => {
    const modalOnCloseTriggered = () => dialog.close();

    dialog = createTableFlowImporter({
      ...(args.isModal ? { modalOnCloseTriggered } : {}),
      ...(args.isModal ? { modalCloseOnOutsideClick: args.modalCloseOnOutsideClick } : {}),
      ...args,
    } as TableFlowImporterProps);
    return args?.isModal ? `<button type="button" id="uploadButton">Import</button>` : "";
  },
  argTypes: {
    elementId: { control: "text" },
    importerId: { control: "text" },
    hostUrl: { control: "text" },
    darkMode: { control: "boolean" },
    primaryColor: { control: "color" },
    modalCloseOnOutsideClick: { control: "boolean" },
    showImportLoadingStatus: { control: "boolean" },
    skipHeaderRowSelection: { control: "boolean" },
    showDownloadTemplateButton: { control: "boolean" },
    schemaless: { control: "boolean" },
  },
} satisfies Meta<TableFlowImporterProps>;

export default meta;
type Story = StoryObj<TableFlowImporterProps>;

export const App: Story = {
  args: {
    elementId: "tableflow-importer",
    importerId: "4b805f5f-ee9c-4248-bb9c-8afd77ea933f", // 7e83ef24-c8f8-479f-8825-046e7da368c4
    hostUrl: "http://localhost:3001",
    darkMode: true,
    primaryColor: "#7a5ef8",
    metadata: { userId: 1234, userEmail: "test@example.com" },
    // template: {
    //   columns: [
    //     {
    //       name: "First",
    //       key: "first_name",
    //       required: false,
    //       description: "The first name of the user",
    //     },
    //   ],
    // },
    onComplete: (data: any) => console.log("onComplete", data),
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
    cssOverrides: {
      ".uppy-Dashboard-AddFiles": "border: none",
      Main_header: "margin-bottom: var(--m-xxs)",
      "Stepper-module_stepper": "gap: var(--m-l)",
      "Stepper-module_step": "flex-direction: column",
      "Stepper-module_step:before, Uploader_content > Default-module_table": "display: none",
      "Some-example > *:first-child": "color: red; padding: 20px; font-size: 1rem",
      "Some-other_example[disabled]": `
            color: red;
            padding: 20px;
            font-size: 1rem;
          `,
    },
    isModal: true,
  },
};

const tableFlowInstance = () => {
  dialog?.showModal();
};

// Attach event listener to the button after the render
document.addEventListener("DOMContentLoaded", () => {
  const uploadButton = document.getElementById("uploadButton");
  if (uploadButton) {
    uploadButton.addEventListener("click", () => {
      tableFlowInstance();
    });
  }
});
