import { ProvidersProps } from "./types";
import Embed from "./Embed";
import QueriesProvider from "./Queries";
import ThemeContextProvider from "./Theme";

export default function Providers({ children }: ProvidersProps) {
  return (
    <QueriesProvider>
      <ThemeContextProvider>
        <Embed>{children}</Embed>
      </ThemeContextProvider>
    </QueriesProvider>
  );
}
