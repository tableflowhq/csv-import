import Importer from "../../importer-ui/features/main";
import React, { useEffect, useRef } from "react";
import "./style/tableflow-importer.css";
import "../../importer-ui/style/index.scss";
import { TableFlowImporterProps } from "./types";
import useThemeStore from "../../importer-ui/stores/theme";
import { useColorMode } from "@chakra-ui/react";
import { darkenColor, isValidColor } from "../../importer-ui/utils/utils";

export default function TableFlowImporter(importerProps: TableFlowImporterProps) {
  const {
    isModal = true,
    modalIsOpen = true,
    modalOnCloseTriggered = () => null,
    modalCloseOnOutsideClick,
    template,
    darkMode = false,
    primaryColor = "#7a5ef8",
    className,
    onComplete,
    customStyles,
    showDownloadTemplateButton,
    skipHeaderRowSelection,
    ...props
  } = importerProps;

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

  // Set Light/Dark mode
  const setTheme = useThemeStore((state) => state.setTheme);
  const { colorMode, toggleColorMode } = useColorMode();

  useEffect(() => {
    setTheme(darkMode ? "dark" : "light");
    if (darkMode && colorMode === "light") toggleColorMode();
    if (!darkMode && colorMode === "dark") toggleColorMode();
  }, [darkMode]);

  // Apply primary color
  useEffect(() => {
    if (primaryColor && isValidColor(primaryColor)) {
      const root = document.documentElement;
      root.style.setProperty("--color-primary", primaryColor);
      root.style.setProperty("--color-primary-hover", darkenColor(primaryColor, 20));
    }
  }, [primaryColor]);

  const backdropClick = (event: { target: any; }) => {
    if (modalCloseOnOutsideClick && event.target === current) {
      modalOnCloseTriggered();
    }
  };

  const elementProps = {
    ref,
    ...(isModal ? { onClick: backdropClick } : {}),
    className: domElementClass,
    ...props,
  };

  return isModal ? (
    <dialog {...elementProps}>
      <Importer {...importerProps} />
    </dialog>
  ) : (
    <div {...elementProps}>
      <Importer {...importerProps} />
    </div>
  );
}
