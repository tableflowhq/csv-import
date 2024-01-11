import { IconContext } from "react-icons";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import theme from "../settings/chakra";
import { sizes } from "../settings/theme";
import { ThemeProps } from "./types";

const chakraTheme = extendTheme(theme);

export default function ThemeProvider({ children }: ThemeProps): React.ReactElement {
  return (
    <ChakraProvider resetCSS={false} theme={chakraTheme}>
      <IconContext.Provider value={{ className: "react-icon", size: sizes.icon.medium }}>{children}</IconContext.Provider>
    </ChakraProvider>
  );
}
