import i18, { Resource } from "i18next";
import { initReactI18next } from "react-i18next";
import esTranslation from "./es";
import frTranslation from "./fr";
import itTranslations from "./it";
import deTranslations from "./de";

const resources: Resource = {
  en: {
    translation: {},
  },
  fr: {
    translation: frTranslation,
  },
  es: {
    translation: esTranslation,
  },
  it: {
    translation: itTranslations,
  },
  de: {
    translation: deTranslations,
  },
};

i18.use(initReactI18next).init({
  resources,
  lng: "en",
  keySeparator: false,
  interpolation: {
    escapeValue: false,
  },
});

export default i18;
