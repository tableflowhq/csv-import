type SearchParams = Record<"importerId" | "darkMode" | "primaryColor" | "metadata" | "isOpen", string>;

export default function useSearchParams() {
  const search = new URLSearchParams(document.location.search);
  const searchParams = new URLSearchParams(search);
  const params = Object.fromEntries(searchParams.entries()) as SearchParams;
  return params;
}
