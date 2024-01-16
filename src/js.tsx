import { createRef } from "react";
import ReactDOM from "react-dom";
import CSVImporter from "./components/CSVImporter";
import { CSVImporterProps } from "./types";

type CreateImporterProps = CSVImporterProps & { domElement?: Element };

export function createCSVImporter(props: CreateImporterProps) {
  const ref = createRef<typeof CSVImporter & HTMLDialogElement>();
  const domElement = props.domElement || document.body;

  ReactDOM.render(<CSVImporter ref={ref} {...props} />, domElement);

  return {
    instance: ref.current,
    showModal: () => {
      ref.current?.showModal?.();
    },
    closeModal: () => {
      ref.current?.close?.();
    },
  };
}
