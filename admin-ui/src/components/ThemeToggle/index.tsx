import { useEffect } from "react";
import { useColorMode } from "@chakra-ui/react";
import { Icon, useThemeStore } from "@tableflow/ui-library";
import style from "./style/ThemeToggle.module.scss";

export default function ThemeToggle() {
  const setTheme = useThemeStore((state) => state.setTheme);
  const theme = useThemeStore((state) => state.theme);
  const { colorMode, toggleColorMode } = useColorMode();

  console.log("ThemeToggle", theme, colorMode);

  useEffect(() => {
    setTheme(theme);
    if (theme === "dark" && colorMode === "light") toggleColorMode();
    if (theme === "light" && colorMode === "dark") toggleColorMode();
  }, [setTheme, theme]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <button className={style.themeToggle} onClick={() => setTheme()}>
      <span className={style.inner}>
        <span>
          <Icon icon="sun" />
        </span>
        <span>
          <Icon icon="moon" />
        </span>
      </span>
    </button>
  );
}
