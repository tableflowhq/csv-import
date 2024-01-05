import ImporterUI from "../importer-ui/features/main";
import React, { useEffect, useRef } from "react";
import "./style/tableflow-importer.css";
import "../importer-ui/style/index.scss";
import { TableFlowImporterProps } from "../types";

export default function TableFlowImporter(importerProps: TableFlowImporterProps) {
  const {
    isModal = true,
    modalIsOpen = true,
    modalOnCloseTriggered = () => null,
    modalCloseOnOutsideClick,
    template,
    darkMode = false,
    primaryColor = "#7a5ef8", // TODO (client-sdk): Apply primary color
    className,
    onComplete,
    customStyles,
    showDownloadTemplateButton,
    skipHeaderRowSelection,
    ...props
  } = importerProps;

  // TODO (client-sdk): Get modal-related props working

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

  // TODO (client-sdk): This triggers when anything is clicked if modalCloseOnOutsideClick is true

  const backdropClick = () => modalCloseOnOutsideClick && modalOnCloseTriggered();

  const elementProps = {
    ref,
    ...(isModal ? { onClick: backdropClick } : {}),
    className: domElementClass,
    ...props,
  };

  return isModal ? (
    <dialog {...elementProps}>
      <ImporterUI {...importerProps} />
    </dialog>
  ) : (
    <div {...elementProps}>
      <ImporterUI {...importerProps} />
    </div>
  );
}
