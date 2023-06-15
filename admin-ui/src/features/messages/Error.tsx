import { PropsWithChildren } from "react";
import { useThemeStore } from "@tableflowhq/ui-library";
import style from "./style/Hello.module.scss";
import { ReactComponent as FailDark } from "../../assets/illos/dark/fail.svg";
import { ReactComponent as FailLight } from "../../assets/illos/light/fail.svg";

export default function ErrorMessage({ children }: PropsWithChildren<{}>) {
  const theme = useThemeStore((state) => state.theme);

  return (
    <div className={style.box}>
      {theme === "light" ? <FailLight /> : <FailDark />}

      {children}
    </div>
  );
}
