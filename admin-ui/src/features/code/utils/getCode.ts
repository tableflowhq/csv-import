import { CodeProps } from "../types";

export default function getCode(props: CodeProps) {
  return `import { useState } from "react";
import { TableFlowImporter } from "@tableflow/react";

function MyComponent(){
  const [isOpen, setIsOpen] = useState(false);

  return <>
    <button onClick={() => setIsOpen(true)}>Open TableFlow Importer</button>

    <TableFlowImporter
      isOpen={isOpen}
      onRequestClose={() => setIsOpen(false)}
      importerId={"${props.importerId || "YOUR_IMPORTER_ID"}"}
      darkMode={true}
      primaryColor="#7A5EF8"
      closeOnClickOutside={true}
      metadata={"{\\"userId\\": 1234, \\"userEmail\\": \\"test@example.com\\"}"}
    />
  </>
}
  `;
}
