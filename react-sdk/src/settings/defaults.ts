import { TableFlowImporterProps } from "../components/TableFlowImporter/types";

const defaults: TableFlowImporterProps = {
    importerId: "89872e9f-3ccd-43e7-93c1-d7dfb680b45b",
    hostUrl: "http://localhost:3001", // https://importer.tableflow.com
    metadata: '{"userId": 1234, "userEmail": "test@example.com"}',
    darkMode: true,
    onComplete: ({ data, error }) => console.log("onComplete", data, error),
    customStyles: { "--font-family-1": "monospace" },
};

export default defaults;
