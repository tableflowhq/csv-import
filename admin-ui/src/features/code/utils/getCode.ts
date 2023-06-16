import { CodeProps } from "../types";


export default function getCode(props: CodeProps) {
  return `import { useState } from "react";
import { TableFlowImporter } from "@tableflow/react-sdk;

function MyComponent(){
  const [isOpen, setIsOpen] = useState(false);

  return <>
    <button onClick={() => setIsOpen(true)}>Open TableFlow Importer</button>

    <TableFlowImporter
      isOpen={isOpen}
      onRequestClose={() => setIsOpen(false)}
      importerId={"${props.importerId || "YOUR_IMPORTER_ID"}"}
      hostUrl={"${props.hostUrl || "YOUR_HOST_URL"}"}
      darkMode={true}
      primaryColor="#999900"
      closeOnClickOutside={true}
      metadata={"{\\"userId\\": 1234, \\"userEmail\\": \\"test@example.com\\"}"}
    />
  </>
}
  `;
}


