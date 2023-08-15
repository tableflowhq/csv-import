import { Meta, StoryObj } from "@storybook/html";
import createTableFlowImporter from ".";
import { TableFlowImporterProps } from "./types";

let dialog: any;

const meta = {
  title: "App",
  render: (args) => {
    const onRequestClose = () => dialog.close();
    dialog = createTableFlowImporter({ ...args, onRequestClose });
    return `<button type="button" id="uploadButton">Upload document</button>`;
  },
  argTypes: {
    elementId: { control: "text" },
    importerId: { control: "text" },
    hostUrl: { control: "text" },
    darkMode: { control: "boolean" },
    primaryColor: { control: "color" },
    metadata: { control: "text" },
    closeOnClickOutside: { control: "boolean" },
    showImportLoadingStatus: { control: "boolean" },
  },
} satisfies Meta<TableFlowImporterProps>;

export default meta;
type Story = StoryObj<TableFlowImporterProps>;

export const App: Story = {
  args: {
    elementId: "tableflow-importer",
    importerId: "4b805f5f-ee9c-4248-bb9c-8afd77ea933f",
    hostUrl: "http://localhost:3001",
    darkMode: true,
    primaryColor: "#7a5ef8",
    metadata: '{"userId": 1234, "userEmail": "test@example.com"}',
    onComplete: (data: any) => console.log(data),
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
