import { TableFlowImporterProps } from "../components/TableFlowImporter/types";

const defaults: TableFlowImporterProps = {
  darkMode: true,
  onComplete: (data) => console.log("onComplete", data),
  isModal: true,
  modalCloseOnOutsideClick: true,
};

export default defaults;
