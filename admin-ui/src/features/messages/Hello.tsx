import { PropsWithChildren } from "react";
import { useThemeStore } from "@tableflowhq/ui-library";
import style from "./style/Hello.module.scss";
import { ReactComponent as HelloDark } from "../../assets/illos/dark/hello.svg";
import { ReactComponent as HelloLight } from "../../assets/illos/light/hello.svg";

export default function Hello({ children }: PropsWithChildren<{}>) {
  const theme = useThemeStore((state) => state.theme);

  return (
    <div className={style.box}>
      {theme === "light" ? <HelloLight /> : <HelloDark />}

      {children}
    </div>
  );
}
