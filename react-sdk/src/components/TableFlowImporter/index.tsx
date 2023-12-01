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
  waitOnComplete,
  customStyles,
  showImportLoadingStatus,
  showDownloadTemplateButton,
  skipHeaderRowSelection,
  cssOverrides,
  schemaless,
  schemalessReadOnly,
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

  importerId = importerId === undefined || importerId?.trim() === "" ? "0" : importerId;

  const urlParams = {
    importerId,
    isModal: isModal ? "true" : "false",
    modalIsOpen: modalIsOpen.toString(),
    template: parseObjectOrStringJSON("template", template),
    darkMode: darkMode.toString(),
    primaryColor,
    metadata: parseObjectOrStringJSON("metadata", metadata),
    onComplete: onComplete ? "true" : "false",
    waitOnComplete: parseOptionalBoolean(waitOnComplete),
    customStyles: parseObjectOrStringJSON("customStyles", customStyles),
    cssOverrides: parseObjectOrStringJSON("cssOverrides", cssOverrides),
    showImportLoadingStatus: parseOptionalBoolean(showImportLoadingStatus),
    showDownloadTemplateButton: parseOptionalBoolean(showDownloadTemplateButton),
    skipHeaderRowSelection: parseOptionalBoolean(skipHeaderRowSelection),
    schemaless: parseOptionalBoolean(schemaless),
    schemalessReadOnly: parseOptionalBoolean(schemalessReadOnly),
  };
  const searchParams = new URLSearchParams(urlParams);
  const defaultImporterUrl = "https://importer.tableflow.com";
  const uploaderUrl = `${hostUrl ? hostUrl : defaultImporterUrl}?${searchParams}`;
  const backdropClick = () => modalCloseOnOutsideClick && modalOnCloseTriggered();

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

  let parsedObj: Record<string, unknown> = {};

  if (typeof param === "string") {
    try {
      parsedObj = JSON.parse(param);
    } catch (e) {
      console.error(
        `The '${name}' prop is not a valid JSON string. This prop can either be a JSON string or JSON object. Please check the documentation for more details.`
      );
      return "";
    }
  } else {
    parsedObj = param;
  }

  // Replace % symbols with %25
  for (const key in parsedObj) {
    if (typeof parsedObj[key] === "string") {
      parsedObj[key] = (parsedObj[key] as string).replace(/%(?!25)/g, "%25");
    }
  }

  return JSON.stringify(parsedObj);
};

const parseOptionalBoolean = (val?: boolean) => {
  return typeof val === "undefined" || val === null ? "" : val ? "true" : "false";
};
