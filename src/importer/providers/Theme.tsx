import { IconContext } from "react-icons";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import theme from "../settings/chakra";
import { sizes } from "../settings/theme";
import { ThemeProps } from "./types";

export const myCache = createCache({
  key: "csv-importer",
});

const chakraTheme = extendTheme(theme);

export default function ThemeProvider({ children }: ThemeProps): React.ReactElement {
  return (
    <CacheProvider value={myCache}>
      <ChakraProvider resetCSS={false} disableGlobalStyle={true} theme={chakraTheme}>
        <IconContext.Provider value={{ className: "react-icon", size: sizes.icon.medium }}>{children}</IconContext.Provider>
      </ChakraProvider>
    </CacheProvider>
  );
}
