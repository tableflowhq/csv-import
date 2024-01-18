import { ProvidersProps } from "./types";
import ThemeContextProvider from "./Theme";

export default function Providers({ children }: ProvidersProps) {
  return <ThemeContextProvider>{children}</ThemeContextProvider>;
}
