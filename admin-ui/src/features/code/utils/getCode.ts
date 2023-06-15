import { CodeProps } from "../types";

export default function getCode(props: CodeProps) {
  return `import { TableFlowImporter } from "@tableflowhq/react-sdk;

function MyComponent(){
    const [isOpen, setIsOpen] = useState(false);

    return <>
        <button onClick={() => setIsOpen(true)}>Open TableFlow Importer</button>

        <TableFlowImporter
            isOpen={isOpen}
            onRequestClose={() => setIsOpen(false)}
            importerId={"${props.importerId || "YOUR_IMPORTER_ID"}"};
            hostUrl={"${props.hostUrl || "YOUR_HOST_URL"}"};
            darkMode
            primaryColor="#999900"
            closeOnClickOutside
            metadata={{"userId": "123", "userEmail": "email@email.com"}};
        />
    </>
}";`;
}
