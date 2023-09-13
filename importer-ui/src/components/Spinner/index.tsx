import { useEffect, useState } from "react";
import { classes } from "@tableflow/ui-library";
import { SpinnerProps } from "./types";
import style from "./style/Spinner.module.scss";
import { ReactComponent as Pulse } from "../../assets/spinners/pulse.svg";

export default function Spinner({ className, children, delay, ...props }: SpinnerProps) {
  const [delayComplete, setDelayComplete] = useState(false);

  useEffect(() => {
    if (delay) {
      const timeout = setTimeout(() => {
        setDelayComplete(true);
      }, delay);
      return () => clearTimeout(timeout);
    } else {
      setDelayComplete(true);
    }
  }, [delay]);

  if (!delayComplete) return null;

  return (
    <div className={classes([style.spinner, className])} {...props}>
      <Pulse />
      {children ? <div>{children}</div> : null}
    </div>
  );
}
