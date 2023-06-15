import { PropsWithChildren } from "react";
import useThemeStore from "../../stores/theme";
import style from "./style/Hello.module.scss";
import { ReactComponent as SorryDark } from "../../assets/illos/dark/sorry.svg";
import { ReactComponent as SorryLight } from "../../assets/illos/light/sorry.svg";

export default function Sorry({ children }: PropsWithChildren<{}>) {
  const theme = useThemeStore((state) => state.theme);

  return (
    <div className={style.box}>
      {theme === "light" ? <SorryLight /> : <SorryDark />}

      {children}
    </div>
  );
}
