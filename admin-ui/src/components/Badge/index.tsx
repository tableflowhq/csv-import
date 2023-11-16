import classes from "../../utils/classes";
import { BadgeProps } from "./types";
import style from "./style/Badge.module.scss";

export default function Badge({ variants = [], className, ...props }: BadgeProps) {
  const variantStyles = classes(variants.map((c: string) => style[c]));
  const badgeClasses = classes([style.badge, variantStyles, className]);

  return <span {...props} className={badgeClasses} />;
}
