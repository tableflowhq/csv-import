import { CodeProps } from "../types";

export default function getCodeJavaScript(props: CodeProps) {
  let hostUrlLine = "";
  if (props.hostUrl) {
    hostUrlLine = `\n  hostUrl: "${props.hostUrl}",`;
  }
  return `import { tableFlowImporter } from "@tableflow/js";

const args = {
  importerId: "${props.importerId || "YOUR_IMPORTER_ID"}",${hostUrlLine}
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
