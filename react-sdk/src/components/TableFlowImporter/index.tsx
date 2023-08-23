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
  darkMode = false,
  primaryColor = "#7a5ef8",
  metadata = "{}",
  closeOnClickOutside,
  className,
  onComplete,
  customStyles,
  showImportLoadingStatus,
  skipHeaderRowSelection,
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
    darkMode: darkMode.toString(),
    primaryColor,
    metadata,
    isOpen: isOpen.toString(),
    onComplete: onComplete ? "true" : "false",
    customStyles: JSON.stringify(customStyles),
    showImportLoadingStatus: showImportLoadingStatus ? "true" : "false",
    skipHeaderRowSelection: skipHeaderRowSelection ? "true" : "false",
  };
  const searchParams = new URLSearchParams(urlParams);
  const defaultImporterUrl = "https://importer.tableflow.com";
  const uploaderUrl = `${hostUrl ? hostUrl : defaultImporterUrl}?${searchParams}`;
  const backdropClick = (e: any) => closeOnClickOutside && onRequestClose();

  useEffect(() => {
    try {
      JSON.parse(metadata);
    } catch (e) {
      console.error('The "metadata" prop is not a valid JSON string. Please check the documentation for more details.');
    }
  }, [metadata]);

  useListenMessage(importerId, onComplete, onRequestClose);

  return (
    <dialog ref={ref} className={dialogClass} onClick={backdropClick} {...props}>
      <iframe src={uploaderUrl} />
    </dialog>
  );
}
