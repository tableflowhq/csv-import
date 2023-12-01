import classes from "../../utils/classes";
import { TableflowProps } from "./types";
import style from "./style/Tableflow.module.scss";
import { ReactComponent as TableflowLogoColor } from "../../assets/tableflow-logo-color.svg";
import { ReactComponent as TableflowLogo } from "../../assets/tableflow-logo.svg";
import { ReactComponent as TableflowLogoShort } from "../../assets/tableflow-logo-short.svg";

export default function Tableflow({ color, size = "normal", short = false }: TableflowProps) {
  const className = classes(["tableflow", style.tableflow, style[size]]);

  return (
    <div className={className}>
      {color ? (
        <>{short ? <TableflowLogoShort /> : <TableflowLogoColor />}</>
      ) : (
        <>{short ? <TableflowLogoShort /> : <TableflowLogo />}</>
      )}
    </div>
  );
}
