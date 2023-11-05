import classes from "../../utils/classes";
import { TableflowProps } from "./types";
import style from "./style/Tableflow.module.scss";
import { ReactComponent as TableflowLogoColor } from "../../assets/tableflow-logo-color.svg";
import { ReactComponent as TableflowLogo } from "../../assets/tableflow-logo.svg";

export default function Tableflow({ color, size = "normal" }: TableflowProps) {
  const className = classes(["tableflow", style.tableflow, style[size]]);

  return <div className={className}>{color ? <TableflowLogoColor /> : <TableflowLogo />}</div>;
}
