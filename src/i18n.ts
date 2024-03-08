import i18, { Resource } from "i18next";
import { initReactI18next } from "react-i18next";

// TODO: move this into a separate file(s)
const resources: Resource = {
  en: {
    translation: {},
  },
  fr: {
    translation: {
      "Upload": "Télécharger",
      "Download Template": "Télécharger le modèle",
    },
  },
  es: {
    translation: {
      "Upload": "Subir",
      "Select Header": "Seleccionar encabezado",
      "Map Columns": "Mapear columnas",
      "Expected Column": "Columnas esperadas",
      "Required": "Requerido",
      "Drop your file here": "Suelta tu archivo aquí",
      "or": "o",
      "Browse files": "Examinar archivos",
      "Download Template": "Descargar plantilla",
      "Only CSV, XLS, and XLSX files can be uploaded": "Solo se pueden subir archivos CSV, XLS y XLSX",
    },
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
