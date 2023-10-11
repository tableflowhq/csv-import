import classes from "../../utils/classes";
import { IconType } from "../Icon/types";
import { ButtonProps, buttonVariant } from "./types";
import style from "./style/Button.module.scss";
import Icon from "../Icon";

export default function Button({ children, icon, className, variants = [], iconPosition = "left", ...props }: ButtonProps) {
  const variantStyles = classes(variants.map((c: string) => style[c]));
  const containerClassName = classes([style.button, variantStyles, className]);

  const iconId = (["sort", "sortUp", "sortDown"] as buttonVariant[]).some((i) => variants.includes(i)) ? "sort" : icon;

  const iconSize = variants.includes("fullWidth") ? "m" : "s";

  const iconElement = <span className={style.icon}>{typeof icon === "string" ? <Icon icon={iconId as IconType} size={iconSize} /> : icon}</span>;

  return (
    <button {...props} className={containerClassName}>
      {!!iconId && iconPosition === "left" && iconElement}
      {children && <span className={style.label}>{children}</span>}
      {!!iconId && iconPosition === "right" && iconElement}
    </button>
  );
}
