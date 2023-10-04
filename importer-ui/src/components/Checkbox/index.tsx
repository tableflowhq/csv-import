import classes from "../../utils/classes";
import { CheckboxProps } from "./types";
import style from "./style/Checkbox.module.scss";

export default function Checkbox({ label, className, ...props }: CheckboxProps) {
  const containerClasses = classes([style.container, className]);

  return (
    <label className={containerClasses}>
      <input type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  );
}
