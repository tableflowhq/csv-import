import { Button, Icon } from "@tableflow/ui-library";
import { useThemeStore } from "@tableflow/ui-library";
import style from "./style/Common.module.scss";
import { ReactComponent as SofaDark } from "../../assets/illos/dark/sofa.svg";
import { ReactComponent as SofaLight } from "../../assets/illos/light/sofa.svg";

type NoPasswordProps = {
  handleClose: () => void;
};

export default function NoPassword({ handleClose }: NoPasswordProps) {
  const theme = useThemeStore((state) => state.theme);

  return (
    <div className={style.box}>
      <div className={style.top}>
        <Button onClick={handleClose} icon="cross" variants={["square"]} />
      </div>

      {theme === "light" ? <SofaLight /> : <SofaDark />}

      <h2>Forgot Password?</h2>

      <p>Please email support@tableflow.com to reset your password.</p>

      <Button onClick={handleClose}>Close</Button>
    </div>
  );
}
