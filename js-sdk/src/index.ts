import { TableFlowImporterProps } from "./types";
import "./index.css";

let postMessages: string[] = [];

export default function createTableFlowImporter({
  elementId = "tableflow-importer",
  importerId,
  hostUrl,
  isModal = true,
  modalOnCloseTriggered = () => null,
  modalCloseOnOutsideClick,
  template,
  darkMode = false,
  primaryColor = "#7a5ef8",
  metadata = "{}",
  onComplete,
  customStyles,
  className,
  showImportLoadingStatus,
  showDownloadTemplateButton,
  skipHeaderRowSelection,
  cssOverrides,
  schemaless,
}: TableFlowImporterProps) {
  // CSS classes
  const baseClass = "TableFlowImporter";
  const themeClass = darkMode && `${baseClass}-dark`;
  const domElementClass = [`${baseClass}-${isModal ? "dialog" : "div"}`, themeClass, className].filter((i) => i).join(" ");

  // domElement element
  let domElement = document.getElementById(elementId) as HTMLDialogElement | HTMLDivElement;

  const backdropClick = () => {
    if (modalCloseOnOutsideClick) modalOnCloseTriggered();
  };

  if (domElement === null) {
    domElement = isModal ? (document.createElement("dialog") as HTMLDialogElement) : (document.createElement("div") as HTMLDivElement);
    document.body.appendChild(domElement);
    domElement.setAttribute("id", elementId);
    if (isModal) domElement.addEventListener("click", backdropClick);
  }

  domElement.setAttribute("class", domElementClass);

  // iframe element
  let urlParams = {
    importerId,
    isModal: isModal ? "true" : "false",
    modalIsOpen: "true",
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

    if (messageData?.type === "start" && urlParams.modalIsOpen !== "true") {
      urlParams = { ...urlParams, modalIsOpen: "true" };
      const uploaderUrl = getUploaderUrl(urlParams, hostUrl);
      domElement.innerHTML = `<iframe src="${uploaderUrl}" />`;
    }

    if (messageData?.type === "complete" && onComplete) {
      onComplete({
        data: messageData?.data || null,
        error: messageData?.error || null,
      });
      postMessages.push(messageData?.id);
    }

    if (messageData?.type === "close" && modalOnCloseTriggered) {
      modalOnCloseTriggered();
      postMessages.push(messageData?.id);

      if (urlParams.modalIsOpen !== "false") {
        urlParams = { ...urlParams, modalIsOpen: "false" };
        const uploaderUrl = getUploaderUrl(urlParams, hostUrl);
        domElement.innerHTML = `<iframe src="${uploaderUrl}" />`;
      }
    }
  }

  window.addEventListener("message", messageListener);

  domElement.innerHTML = `<iframe src="${uploaderUrl}" />`;

  return domElement;
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
