import { ProvidersProps } from "./types";
import AuthProvider from "./Auth";
import QueriesProvider from "./Queries";
import RouterProvider from "./Router";
import ThemeContextProvider from "./Theme";

export default function Providers({ children }: ProvidersProps) {
  return (
    <QueriesProvider>
      <AuthProvider>
        <RouterProvider>
          <ThemeContextProvider>{children}</ThemeContextProvider>
        </RouterProvider>
      </AuthProvider>
    </QueriesProvider>
  );
}
