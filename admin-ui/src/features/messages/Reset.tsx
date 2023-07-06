import { PropsWithChildren } from "react";
import { useThemeStore } from "@tableflow/ui-library";
import style from "./style/Hello.module.scss";
import { ReactComponent as ResetDark } from "../../assets/illos/dark/plane.svg";
import { ReactComponent as ResetLight } from "../../assets/illos/light/plane.svg";

export default function Reset({ children }: PropsWithChildren<{}>) {
  const theme = useThemeStore((state) => state.theme);

  return (
    <div className={style.box}>
      {theme === "light" ? <ResetLight /> : <ResetDark />}

      {children}
    </div>
  );
}
