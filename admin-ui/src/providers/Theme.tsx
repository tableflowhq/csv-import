import { useEffect } from "react";
import { useThemeStore } from "@tableflowhq/ui-library";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ThemeProps } from "./types";

export default function ThemeProvider({ children }: ThemeProps): React.ReactElement {
  const setTheme = useThemeStore((state) => state.setTheme);

  useEffect(() => {
    setTheme("dark");
  }, []);

  return (
    <MantineProvider>
      <Notifications />
      {children}
    </MantineProvider>
  );
}
