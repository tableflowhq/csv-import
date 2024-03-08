import i18, { Resource } from "i18next";
import { initReactI18next } from "react-i18next";
import esTranslations from "./es";

// TODO: move this into a separate file(s)
console.log(esTranslations);
const resources: Resource = {
  en: {
    translation: {},
  },
  fr: {
    translation: {
      Upload: "Télécharger",
      "Download Template": "Télécharger le modèle",
    },
  },
  es: {
    translation: esTranslations,
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
