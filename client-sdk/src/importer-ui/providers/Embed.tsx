import { useEffect } from "react";
import { useColorMode } from "@chakra-ui/react";
import useSearchParams from "../hooks/useSearchParams";
import useEmbedStore from "../stores/embed";
import useThemeStore from "../stores/theme";
import { EmbedProps } from "./types";

// TODO (client-sdk): Migrate this component
export default function Embed({ children }: EmbedProps) {
  const {
    importerId,
    darkMode: darkModeString,
    primaryColor,
    metadata,
    template,
    isModal,
    isOpen, // Deprecated: use modalIsOpen
    modalIsOpen,
    onComplete,
    waitOnComplete,
    customStyles,
    showImportLoadingStatus,
    skipHeaderRowSelection,
    cssOverrides,
    schemaless,
    schemalessReadOnly,
    showDownloadTemplateButton,
  } = useSearchParams();

  // Set importerId & metadata in embed store
  const setEmbedParams = useEmbedStore((state) => state.setEmbedParams);
  const strToBoolean = (str: string) => !!str && (str.toLowerCase() === "true" || str === "1");
  const strToOptionalBoolean = (str: string) => (str ? str.toLowerCase() === "true" || str === "1" : undefined);
  const strToDefaultBoolean = (str: string, defaultValue: boolean) => (str ? str.toLowerCase() === "true" || str === "1" : defaultValue);
  const validateJSON = (str: string, paramName: string) => {
    if (!str || str === "undefined") {
      return "";
    }
    try {
      const obj = JSON.parse(str);
      return JSON.stringify(obj);
    } catch (e) {
      console.error(`The parameter '${paramName}' could not be parsed as JSON. Please check the documentation for more details.`, e);
      return "";
    }
  };

  useEffect(() => {
    setEmbedParams({
      // importerId,
      // metadata: validateJSON(metadata, "metadata"),
      template: validateJSON(template, "template"),
      // If only the deprecated isOpen is provided, use that. Else, use modalIsOpen
      modalIsOpen: strToBoolean(modalIsOpen === "" && isOpen !== "" ? isOpen : modalIsOpen),
      onComplete: strToBoolean(onComplete),
      waitOnComplete: strToBoolean(waitOnComplete),
      // showImportLoadingStatus: strToBoolean(showImportLoadingStatus),
      skipHeaderRowSelection: strToOptionalBoolean(skipHeaderRowSelection),
      isModal: strToDefaultBoolean(isModal, true),
      // schemaless: strToOptionalBoolean(schemaless),
      // schemalessReadOnly: strToOptionalBoolean(schemalessReadOnly),
      showDownloadTemplateButton: strToDefaultBoolean(showDownloadTemplateButton, true),
      customStyles: validateJSON(customStyles, "customStyles"),
      // cssOverrides: validateJSON(cssOverrides, "cssOverrides"),
    });
  }, [importerId, metadata]);

  // Set Light/Dark mode
  const darkMode = strToBoolean(darkModeString);
  const setTheme = useThemeStore((state) => state.setTheme);
  const { colorMode, toggleColorMode } = useColorMode();

  // Check if a hex color is valid
  const isValidColor = (color: string) => /^#([0-9A-F]{3}){1,2}$/i.test(color);

  // Expand a three-character hex to six characters
  const expandHex = (color: string) => {
    if (color.length === 4) {
      // #rgb => #rrggbb
      color = "#" + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
    }
    return color;
  };

  // Darken a hex color by a certain percent
  const darkenColor = (color: string, percent: number) => {
    if (!isValidColor(color)) return color;

    color = expandHex(color); // Ensure the color is in 6-character format

    const num = parseInt(color.replace("#", ""), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) - amt,
      B = ((num >> 8) & 0x00ff) - amt,
      G = (num & 0x0000ff) - amt;

    return (
      "#" +
      (0x1000000 + (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 + (B < 255 ? (B < 1 ? 0 : B) : 255) * 0x100 + (G < 255 ? (G < 1 ? 0 : G) : 255))
        .toString(16)
        .slice(1)
    );
  };

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

  return <>{children}</>;
}
