import { ProvidersProps } from "./types";
import Embed from "./Embed";
import QueriesProvider from "./Queries";
import RouterProvider from "./Router";
import ThemeContextProvider from "./Theme";

export default function Providers({ children }: ProvidersProps) {
  return (
    <QueriesProvider>
      <RouterProvider>
        <ThemeContextProvider>
          <Embed>{children}</Embed>
        </ThemeContextProvider>
      </RouterProvider>
    </QueriesProvider>
  );
}
