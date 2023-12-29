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
    schemalessReadOnly: { control: "boolean" },
    schemalessDataTypes: { control: "boolean" },
    waitOnComplete: { control: "boolean" },
  },
} satisfies Meta<TableFlowImporterProps>;

export default meta;
type Story = StoryObj<TableFlowImporterProps>;

export const App: Story = {
  args: {
    elementId: "tableflow-importer",
    importerId: "7e83ef24-c8f8-479f-8825-046e7da368c4",
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
    // cssOverrides: {
    //   "MapColumns Default_td:nth-child(2)": "display: none",
    //   "MapColumns Default_td:nth-child(1)": "width: 50% !important",
    //   Main_content: "height: auto",
    //   Main_wrapper: "justify-content: flex-start; padding-top: var(--m)",
    //   Main_header: "margin-bottom: var(--m-xxs)",
    //   "Stepper-module_stepper": "gap: var(--m-l)",
    //   "Stepper-module_step": "flex-direction: column",
    //   "Stepper-module_step:before": "display: none",
    //   "Default-module_td span": "font-size: 0.875rem",
    //   "Input-module_small Input-module_inputWrapper": "font-size: 0.875rem",
    //   "Checkbox-module_container input[type=checkbox]": "width: var(--m-s); height: var(--m-s)",
    //   "Checkbox-module_container input[type=checkbox]::before": "width: var(--m-xxs); height: var(--m-xxs)",
    //   Uploader_box: "display: none",
    //   ".uppy-Dashboard-AddFiles": "border: none",
    //   ".uppy-Container .uppy-Dashboard-AddFiles-title": "font-size: 18px",
    // },
    isModal: true,
    modalCloseOnOutsideClick: true,
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
