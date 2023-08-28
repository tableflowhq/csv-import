import { TableFlowImporterProps } from "./types/index";
import "./index.css";

let postMessages: string[] = [];

export default function createTableFlowImporter({
  elementId = "tableflow-importer",
  onRequestClose = () => null,
  importerId,
  template = "",
  hostUrl,
  darkMode = false,
  primaryColor = "#7a5ef8",
  metadata = "{}",
  closeOnClickOutside,
  onComplete,
  customStyles,
  className,
  showImportLoadingStatus,
  skipHeaderRowSelection,
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
    template,
    darkMode: darkMode.toString(),
    primaryColor,
    metadata,
    isOpen: "true",
    onComplete: onComplete ? "true" : "false",
    customStyles: JSON.stringify(customStyles),
    showImportLoadingStatus: showImportLoadingStatus ? "true" : "false",
    skipHeaderRowSelection: skipHeaderRowSelection ? "true" : "false",
  };

  const uploaderUrl = getUploaderUrl(urlParams, hostUrl);

  try {
    JSON.parse(metadata);
  } catch (e) {
    console.error("The 'metadata' prop is not a valid JSON string. Please check the documentation for more details.");
  }

  if (template) {
    try {
      JSON.parse(template);
    } catch (e) {
      console.error("The 'template' prop is not a valid JSON string. Please check the documentation for more details.");
    }
  }

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
