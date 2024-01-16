import ReactDOM from "react-dom";
import CSVImporter from "./components/CSVImporter";
import { CSVImporterProps } from "./types";

export { CSVImporter };

type CreateImporterProps = CSVImporterProps & { domElement?: HTMLElement };

export function createCSVImporter(props: CreateImporterProps) {
  const domElement = props.domElement || document.body;
  return ReactDOM.render(<CSVImporter {...props} />, domElement);
}
