import React, { useEffect, useRef } from "react";
import { useColorMode } from "@chakra-ui/react";
import Importer from "../../importer/features/main";
import Providers from "../../importer/providers";
import useThemeStore from "../../importer/stores/theme";
import { darkenColor, isValidColor } from "../../importer/utils/utils";
import { CSVImporterProps } from "../../types";
import "../../importer/style/index.scss";
import "./style/csv-importer.css";

export default function CSVImporter(importerProps: CSVImporterProps) {
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
  const baseClass = "CSVImporter";
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

  const backdropClick = (event: { target: any }) => {
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

  const ImporterComponent = () => (
    <Providers>
      <Importer {...importerProps} />
    </Providers>
  );

  return isModal ? (
    <dialog {...elementProps}>
      <ImporterComponent />
    </dialog>
  ) : (
    <div {...elementProps}>
      <ImporterComponent />
    </div>
  );
}
