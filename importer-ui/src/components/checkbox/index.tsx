import { CheckboxProps } from "./types";
import style from "./style/Checkbox.module.scss";

export default function Checkbox({ label, ...props }: CheckboxProps) {
  return (
    <div className={style.container}>
      <input type="checkbox" {...props} />
      <label>{label}</label>
    </div>
  );
}
