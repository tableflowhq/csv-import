import { CodeProps } from "../types";

export default function getCodeJavaScript(props: CodeProps) {
  let hostUrlLine = "";
  if (props.hostUrl) {
    hostUrlLine = `\n  hostUrl: "${props.hostUrl}",`;
  }
  return `import createTableFlowImporter from "@tableflow/js";

const importer = createTableFlowImporter({
  importerId: "${props.importerId || "YOUR_IMPORTER_ID"}",${hostUrlLine}
  modalOnCloseTriggered: () => importer.close(),
  onComplete: (data, error) => console.log(data),
  darkMode: ${props.theme !== "light"},
});

const uploadButton = document.getElementById("uploadButton");
uploadButton.addEventListener("click", () => {
  importer?.showModal();
});`;
}
