import { classes } from "@tableflow/ui-library";
import { SpinnerProps } from "./types";
import style from "./style/Spinner.module.scss";
import { ReactComponent as Pulse } from "../../assets/spinners/pulse.svg";

export default function Spinner({ className, children, ...props }: SpinnerProps) {
  return (
    <div className={classes([style.spinner, className])} {...props}>
      <Pulse />
      {children ? <div>{children}</div> : null}
    </div>
  );
}
