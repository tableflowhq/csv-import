import { CodeProps } from "../types";

export default function getCodeReact(props: CodeProps) {
  let hostUrlLine = "";
  if (props.hostUrl) {
    hostUrlLine = `\n        hostUrl={"${props.hostUrl}"}`;
  }
  return `import { useState } from "react";
import { TableFlowImporter } from "@tableflow/react-sdk";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open TableFlow Importer</button>

      <TableFlowImporter
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        importerId={"${props.importerId || "YOUR_IMPORTER_ID"}"}
        darkMode={${props.theme !== "light"}}${hostUrlLine}
        primaryColor="#7A5EF8"
        closeOnClickOutside={true}
        metadata={"{\\"userId\\": 1234, \\"userEmail\\": \\"test@example.com\\"}"}
      />
    </>
  );
}`;
}
