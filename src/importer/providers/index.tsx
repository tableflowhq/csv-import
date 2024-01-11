import { ProvidersProps } from "./types";
import QueriesProvider from "./Queries";
import ThemeContextProvider from "./Theme";

export default function Providers({ children }: ProvidersProps) {
  return (
    <QueriesProvider>
      <ThemeContextProvider>{children}</ThemeContextProvider>
    </QueriesProvider>
  );
}
