import { CodeProps } from "../types";

export default function getCodeReact(props: CodeProps) {
  let hostUrlLine = "";
  if (props.hostUrl) {
    hostUrlLine = `\n        hostUrl={"${props.hostUrl}"}`;
  }
  return `import { useState } from "react";
import { TableFlowImporter } from "@tableflow/react";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open TableFlow Importer</button>

      <TableFlowImporter
        importerId={"${props.importerId || "YOUR_IMPORTER_ID"}"}${hostUrlLine}
        modalIsOpen={isOpen}
        modalOnCloseTriggered={() => setIsOpen(false)}
        darkMode={${props.theme !== "light"}}
        onComplete={(data, error) => console.log(data)}
      />
    </>
  );
}`;
}
