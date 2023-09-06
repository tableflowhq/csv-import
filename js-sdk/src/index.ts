import { TableFlowImporterProps } from "./types/index";
import "./index.css";

let postMessages: string[] = [];

export default function createTableFlowImporter({
  elementId = "tableflow-importer",
  onRequestClose = () => null,
  importerId,
  template,
  hostUrl,
  darkMode = false,
  primaryColor = "#7a5ef8",
  metadata = "{}",
  closeOnClickOutside,
  onComplete,
  customStyles,
  className,
  showImportLoadingStatus,
  showDownloadTemplateButton,
  skipHeaderRowSelection,
  schemaless,
}: TableFlowImporterProps) {
  // CSS classes
  const baseClass = "TableFlowImporter";
  const themeClass = darkMode && `${baseClass}-dark`;
  const dialogClass = [`${baseClass}-dialog`, themeClass, className].filter((i) => i).join(" ");

  // dialog element
  let dialog = document.getElementById(elementId) as HTMLDialogElement;

  const backdropClick = () => {
    if (closeOnClickOutside) onRequestClose();
  };

  if (dialog === null) {
    dialog = document.createElement("dialog") as HTMLDialogElement;
    document.body.appendChild(dialog);
    dialog.setAttribute("id", elementId);
    dialog.addEventListener("click", backdropClick);
  }

  dialog.setAttribute("class", dialogClass);

  // iframe element
  let urlParams = {
    importerId,
    template: parseObjectOrStringJSON("template", template),
    darkMode: darkMode.toString(),
    primaryColor,
    metadata: parseObjectOrStringJSON("metadata", metadata),
    isOpen: "true",
    onComplete: onComplete ? "true" : "false",
    customStyles: JSON.stringify(customStyles),
    showImportLoadingStatus: parseOptionalBoolean(showImportLoadingStatus),
    showDownloadTemplateButton: parseOptionalBoolean(showDownloadTemplateButton),
    skipHeaderRowSelection: parseOptionalBoolean(skipHeaderRowSelection),
    schemaless: parseOptionalBoolean(schemaless),
  };

  const uploaderUrl = getUploaderUrl(urlParams, hostUrl);

  function messageListener(e: any) {
    if (!e || !e?.data) return;

    const messageData = e.data;

    if (
      messageData?.source !== "tableflow-importer" ||
      messageData?.importerId !== importerId ||
      !messageData?.id ||
      postMessages.includes(messageData.id)
    ) {
      return;
    }

    if (messageData?.type === "start" && urlParams.isOpen !== "true") {
      urlParams = { ...urlParams, isOpen: "true" };
      const uploaderUrl = getUploaderUrl(urlParams, hostUrl);
      dialog.innerHTML = `<iframe src="${uploaderUrl}" />`;
    }

    if (messageData?.type === "complete" && onComplete) {
      onComplete({
        data: messageData?.data || null,
        error: messageData?.error || null,
      });
      postMessages.push(messageData?.id);
    }

    if (messageData?.type === "close" && onRequestClose) {
      onRequestClose();
      postMessages.push(messageData?.id);

      if (urlParams.isOpen !== "false") {
        urlParams = { ...urlParams, isOpen: "false" };
        const uploaderUrl = getUploaderUrl(urlParams, hostUrl);
        dialog.innerHTML = `<iframe src="${uploaderUrl}" />`;
      }
    }
  }

  window.addEventListener("message", messageListener);

  dialog.innerHTML = `<iframe src="${uploaderUrl}" />`;

  return dialog;
}

function getUploaderUrl(urlParams: any, hostUrl?: string) {
  const searchParams = new URLSearchParams(urlParams);
  const defaultImporterUrl = "https://importer.tableflow.com";
  return `${hostUrl ? hostUrl : defaultImporterUrl}?${searchParams}`;
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
