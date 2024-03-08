import React, { forwardRef, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "../../i18n";
import Importer from "../../importer/features/main";
import Providers from "../../importer/providers";
import useThemeStore from "../../importer/stores/theme";
import { darkenColor, isValidColor } from "../../importer/utils/utils";
import { CSVImporterProps } from "../../types";
import "../../importer/style/index.scss";
import "./style/csv-importer.css";

const CSVImporter = forwardRef((importerProps: CSVImporterProps, forwardRef?: any) => {
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
    language,
    customTranslations,
    ...props
  } = importerProps;
  const ref = forwardRef ?? useRef(null);

  const { t, i18n } = useTranslation();
  const current = ref?.current as any;

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  useEffect(() => {
    if (customTranslations) {
      Object.keys(customTranslations).forEach((language) => {
        i18n.addResourceBundle(language, "translation", customTranslations[language], true, true);
      });
    }
  }, [customTranslations]);

  useEffect(() => {
    if (isModal && current) {
      if (modalIsOpen) current?.showModal?.();
      else current?.close?.();
    }
  }, [isModal, modalIsOpen, current]);
  const baseClass = "CSVImporter";
  const themeClass = darkMode ? `${baseClass}-dark` : `${baseClass}-light`;
  const domElementClass = ["csv-importer", `${baseClass}-${isModal ? "dialog" : "div"}`, themeClass, className].filter((i) => i).join(" ");

  // Set Light/Dark mode
  const setTheme = useThemeStore((state) => state.setTheme);

  useEffect(() => {
    const theme = darkMode ? "dark" : "light";
    setTheme(theme);
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

  current?.addEventListener("cancel", () => {
    modalOnCloseTriggered();
  });

  const elementProps = {
    ref,
    ...(isModal ? { onClick: backdropClick } : {}),
    className: domElementClass,
    "data-theme": darkMode ? "dark" : "light",
    style: { colorScheme: darkMode ? "dark" : "light" },
    ...props,
  };

  const ImporterComponent = () => (
    <Providers>
      <Importer {...importerProps} />
    </Providers>
  );

  return isModal ? (
    <div className="csvImporter">
      <dialog {...elementProps}>
        <h1>{t("Welcome to React")}</h1>
        <ImporterComponent />
      </dialog>
    </div>
  ) : (
    <div {...elementProps}>
      <ImporterComponent />
    </div>
  );
});

export default CSVImporter;
