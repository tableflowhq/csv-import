import { CodeProps } from "../types";

export default function getCodeVanilla(props: CodeProps) {
  return `import { tableFlowImporter } from "@tableflow/vanilla-sdk";

const args = {
  importerId: "${props.importerId || "YOUR_IMPORTER_ID"}",
  hostUrl: "${props.hostUrl || "http://localhost:3001"}",
  darkMode: ${props.theme !== "light"},
  primaryColor: "#7a5ef8",
  metadata: '{"userId": 1234, "userEmail": "test@example.com"}',
  onRequestClose: () => dialog.close(),
}

const uploadButton = document.getElementById("uploadButton");

const dialog = tableFlowImporter(args);

uploadButton.addEventListener("click", () => {
  dialog?.showModal();
});`;
}
