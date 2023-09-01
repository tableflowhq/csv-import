import { useEffect, useRef } from "react";
import useListenMessage from "../../hooks/useListenMessage";
import { TableFlowImporterProps } from "./types";
import "./style/button.css";

export default function TableFlowImporter({
  // TODO: Include "as" parameter to launch as a div
  isOpen = true,
  onRequestClose = () => null,
  importerId,
  hostUrl,
  template,
  darkMode = false,
  primaryColor = "#7a5ef8",
  metadata,
  closeOnClickOutside,
  className,
  onComplete,
  customStyles,
  showImportLoadingStatus,
  skipHeaderRowSelection,
  schemaless,
  ...props
}: TableFlowImporterProps) {
  const ref = useRef(null);
  const current = ref.current as any;

  useEffect(() => {
    if (current) {
      if (isOpen) current.showModal();
      else current.close();
    }
  }, [isOpen, current]);

  const baseClass = "TableFlowImporter";
  const themeClass = darkMode && `${baseClass}-dark`;
  const dialogClass = [`${baseClass}-dialog`, themeClass, className].filter((i) => i).join(" ");

  const urlParams = {
    importerId,
    template: parseObjectOrStringJSON("template", template),
    darkMode: darkMode.toString(),
    primaryColor,
    metadata: parseObjectOrStringJSON("metadata", metadata),
    isOpen: isOpen.toString(),
    onComplete: onComplete ? "true" : "false",
    customStyles: JSON.stringify(customStyles),
    showImportLoadingStatus: showImportLoadingStatus ? "true" : "false",
    skipHeaderRowSelection: typeof skipHeaderRowSelection === "undefined" ? "" : skipHeaderRowSelection ? "true" : "false",
    schemaless: typeof schemaless === "undefined" ? "" : schemaless ? "true" : "false",
  };
  const searchParams = new URLSearchParams(urlParams);
  const defaultImporterUrl = "https://importer.tableflow.com";
  const uploaderUrl = `${hostUrl ? hostUrl : defaultImporterUrl}?${searchParams}`;
  const backdropClick = (e: any) => closeOnClickOutside && onRequestClose();

  useListenMessage(importerId, onComplete, onRequestClose);

  return (
    <dialog ref={ref} className={dialogClass} onClick={backdropClick} {...props}>
      <iframe src={uploaderUrl} />
    </dialog>
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
