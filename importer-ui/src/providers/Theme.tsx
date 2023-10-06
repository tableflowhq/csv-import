import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import theme from "../settings/chakra";
import { ThemeProps } from "./types";

const chakraTheme = extendTheme(theme);

export default function ThemeProvider({ children }: ThemeProps): React.ReactElement {
  return (
    <ChakraProvider resetCSS={false} theme={chakraTheme}>
      {children}
    </ChakraProvider>
  );
}
