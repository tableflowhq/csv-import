import { useEffect } from "react";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import theme from "../settings/chakra";
import { sizes } from "../settings/theme/sizes";
import useThemeStore from "../stores/useThemeStore";
import { ThemeProps } from "./types";
import { IconContext } from "react-icons/lib";

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
        <IconContext.Provider value={{ className: "react-icon", size: sizes.icon.medium }}>
          <Notifications />
          {children}
        </IconContext.Provider>
      </MantineProvider>
    </ChakraProvider>
  );
}
