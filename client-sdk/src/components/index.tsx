import ImporterUI from "../importer-ui/features/main";
import React, { useEffect, useRef } from "react";
import "./style/tableflow-importer.css";
import "../importer-ui/style/index.scss";

export default function TableFlowImporter({
  importerId,
  isModal = false,
  darkMode,
}: {
  importerId?: string;
  isModal?: boolean;
  darkMode?: boolean;
}) {
  const modalIsOpen = true;
  const className = "";
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
  const domElementClass = [
    `${baseClass}-${isModal ? "dialog" : "div"}`,
    themeClass,
    className,
  ]
    .filter((i) => i)
    .join(" ");

  const modalCloseOnOutsideClick = () => {};

  const modalOnCloseTriggered = () => {};

  const backdropClick = () => modalOnCloseTriggered();

  const elementProps = {
    ref,
    ...(isModal ? { onClick: backdropClick } : {}),
    className: domElementClass,
  };

  return isModal ? (
    <dialog {...elementProps}>
      <ImporterUI sdkImporterId={importerId} />
    </dialog>
  ) : (
    <div {...elementProps}>
      <ImporterUI sdkImporterId={importerId} />
    </div>
  );
  return;
}
