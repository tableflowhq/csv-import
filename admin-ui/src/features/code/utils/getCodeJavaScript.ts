import { CodeProps } from "../types";

export default function getCodeJavaScript(props: CodeProps) {
  let hostUrlLine = "";
  if (props.hostUrl) {
    hostUrlLine = `\n  hostUrl: "${props.hostUrl}",`;
  }
  return `import createTableFlowImporter from "@tableflow/js";";

const args = {
  importerId: "${props.importerId || "YOUR_IMPORTER_ID"}",${hostUrlLine}
  darkMode: ${props.theme !== "light"},
  primaryColor: "#7a5ef8",
  metadata: '{"userId": 1234, "userEmail": "test@example.com"}',
  onRequestClose: () => dialog.close(),
  onComplete: (data, error) => {
    if (error) {
      alert(error); // Handle import error
    } else {
      console.log(data); // Use import data
    }
  },
  customStyles: { "--font-family-1": "monospace" },
}
const importer = createTableFlowImporter(args);

const uploadButton = document.getElementById("uploadButton");
uploadButton.addEventListener("click", () => {
  importer?.showModal();
});`;
}
