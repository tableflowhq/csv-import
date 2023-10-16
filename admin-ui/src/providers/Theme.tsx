import { useEffect } from "react";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { useThemeStore } from "@tableflow/ui-library";
import theme from "../settings/chakra";
import { ThemeProps } from "./types";

const chakraTheme = extendTheme(theme);

export default function ThemeProvider({ children }: ThemeProps): React.ReactElement {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  useEffect(() => {
    setTheme(theme);
  }, [setTheme, theme]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ChakraProvider resetCSS={false} theme={chakraTheme}>
      <MantineProvider>
        <Notifications />
        {children}
      </MantineProvider>
    </ChakraProvider>
  );
}
