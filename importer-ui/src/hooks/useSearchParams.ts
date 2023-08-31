type SearchParams = Record<
  | "importerId"
  | "darkMode"
  | "primaryColor"
  | "metadata"
  | "template"
  | "isOpen"
  | "onComplete"
  | "customStyles"
  | "showImportLoadingStatus"
  | "skipHeaderRowSelection"
  | "schemaless",
  string
>;

export default function useSearchParams() {
  const search = new URLSearchParams(document.location.search);
  const searchParams = new URLSearchParams(search);
  const params = Object.fromEntries(searchParams.entries()) as SearchParams;
  return params;
}
