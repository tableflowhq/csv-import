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
  waitOnComplete,
  customStyles,
  className,
  showImportLoadingStatus,
  showDownloadTemplateButton,
  skipHeaderRowSelection,
  cssOverrides,
  schemaless,
  schemalessReadOnly,
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
    waitOnComplete: parseOptionalBoolean(waitOnComplete),
    customStyles: parseObjectOrStringJSON("customStyles", customStyles),
    cssOverrides: parseObjectOrStringJSON("cssOverrides", cssOverrides),
    showImportLoadingStatus: parseOptionalBoolean(showImportLoadingStatus),
    showDownloadTemplateButton: parseOptionalBoolean(showDownloadTemplateButton),
    skipHeaderRowSelection: parseOptionalBoolean(skipHeaderRowSelection),
    schemaless: parseOptionalBoolean(schemaless),
    schemalessReadOnly: parseOptionalBoolean(schemalessReadOnly),
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
      // Add extra data field for temporary backwards compatibility
      // TODO: Remove in later version
      const response = {
        ...messageData?.data,
        // Add the deprecated data field with getter and setter
        get data() {
          console.warn(
            "WARNING: the extra data field is deprecated in the onComplete and will be removed in a later version. The parent object contains all of the import data needed."
          );
          return this._data;
        },
        set data(value) {
          console.warn(
            "WARNING: the extra data field is deprecated in the onComplete and will be removed in a later version. The parent object contains all of the import data needed."
          );
          this._data = value;
        },
      };
      response._data = messageData?.data;

      onComplete(response);
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
