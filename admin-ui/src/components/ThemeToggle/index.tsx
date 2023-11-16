import { useEffect } from "react";
import { useColorMode } from "@chakra-ui/react";
import useThemeStore from "../../stores/useThemeStore";
import style from "./style/ThemeToggle.module.scss";
import { PiMoon, PiSun } from "react-icons/pi";

export default function ThemeToggle() {
  const setTheme = useThemeStore((state) => state.setTheme);
  const theme = useThemeStore((state) => state.theme);
  const { colorMode, toggleColorMode } = useColorMode();

  useEffect(() => {
    setTheme(theme);
    if (theme === "dark" && colorMode === "light") toggleColorMode();
    if (theme === "light" && colorMode === "dark") toggleColorMode();
  }, [setTheme, theme]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <button className={style.themeToggle} onClick={() => setTheme()}>
      <span className={style.inner}>
        <span>
          <PiSun />
        </span>
        <span>
          <PiMoon />
        </span>
      </span>
    </button>
  );
}
