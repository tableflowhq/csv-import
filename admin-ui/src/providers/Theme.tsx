import { useEffect } from "react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { useThemeStore } from "@tableflowhq/ui-library";
import { ThemeProps } from "./types";

export default function ThemeProvider({ children }: ThemeProps): React.ReactElement {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  useEffect(() => {
    setTheme(theme);
  }, [setTheme, theme]);

  return (
    <MantineProvider>
      <Notifications />
      {children}
    </MantineProvider>
  );
}
