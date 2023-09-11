import { useEffect, useRef } from "react";
import useListenMessage from "../../hooks/useListenMessage";
import { TableFlowImporterProps } from "./types";
import "./style/tableflow-importer.css";

export default function TableFlowImporter({
  importerId,
  hostUrl,
  isModal = true,
  modalIsOpen = true,
  modalOnCloseTriggered = () => null,
  modalCloseOnOutsideClick,
  template,
  darkMode = false,
  primaryColor = "#7a5ef8",
  metadata,
  className,
  onComplete,
  customStyles,
  showImportLoadingStatus,
  showDownloadTemplateButton,
  skipHeaderRowSelection,
  cssOverrides,
  schemaless,
  ...props
}: TableFlowImporterProps) {
  const ref = useRef(null);
  const current = ref.current as any;

  useEffect(() => {
    if (isModal && current) {
      if (modalIsOpen) current?.showModal?.();
      else current?.close?.();
    }
  }, [isModal, modalIsOpen, current]);

  const baseClass = "TableFlowImporter";
  const themeClass = darkMode && `${baseClass}-dark`;
  const domElementClass = [`${baseClass}-${isModal ? "dialog" : "div"}`, themeClass, className].filter((i) => i).join(" ");

  const urlParams = {
    importerId,
    isModal: isModal ? "true" : "false",
    modalIsOpen: modalIsOpen.toString(),
    template: parseObjectOrStringJSON("template", template),
    darkMode: darkMode.toString(),
    primaryColor,
    metadata: parseObjectOrStringJSON("metadata", metadata),
    onComplete: onComplete ? "true" : "false",
    customStyles: JSON.stringify(customStyles),
    showImportLoadingStatus: parseOptionalBoolean(showImportLoadingStatus),
    showDownloadTemplateButton: parseOptionalBoolean(showDownloadTemplateButton),
    skipHeaderRowSelection: parseOptionalBoolean(skipHeaderRowSelection),
    ...(cssOverrides ? { cssOverrides: JSON.stringify(cssOverrides) } : {}),
    schemaless: parseOptionalBoolean(schemaless),
  };
  const searchParams = new URLSearchParams(urlParams);
  const defaultImporterUrl = "https://importer.tableflow.com";
  const uploaderUrl = `${hostUrl ? hostUrl : defaultImporterUrl}?${searchParams}`;
  const backdropClick = (e: any) => modalCloseOnOutsideClick && modalOnCloseTriggered();

  useListenMessage(importerId, onComplete, modalOnCloseTriggered);

  const elementProps = {
    ref,
    ...(isModal ? { onClick: backdropClick } : {}),
    className: domElementClass,
    ...props,
  };

  return isModal ? (
    <dialog {...elementProps}>
      <iframe src={uploaderUrl} />
    </dialog>
  ) : (
    <div {...elementProps}>
      <iframe src={uploaderUrl} />
    </div>
  );
}

// Allows for the user to pass in JSON as either an object or a string
const parseObjectOrStringJSON = (name: string, param?: Record<string, unknown> | string): string => {
  if (typeof param === "undefined") {
    return "";
  }
  if (typeof param === "string") {
    try {
      const obj = JSON.parse(param);
      return JSON.stringify(obj);
    } catch (e) {
      console.error(
        `The '${name}' prop is not a valid JSON string. This prop can either be a JSON string or JSON object. Please check the documentation for more details.`
      );
    }
  } else {
    return JSON.stringify(param);
  }
  return "";
};

const parseOptionalBoolean = (val?: boolean) => {
  return typeof val === "undefined" || val === null ? "" : val ? "true" : "false";
};
