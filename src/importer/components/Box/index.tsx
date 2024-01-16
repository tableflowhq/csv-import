import classes from "../../utils/classes";
import { BoxProps } from "./types";
import style from "./style/Box.module.scss";

export default function Box({ className, variants = [], ...props }: BoxProps) {
  const variantStyles = classes(variants.map((c: keyof typeof style) => style[c]));
  const containerClasses = classes([style.box, variantStyles, className]);

  return <div {...props} className={containerClasses} />;
}
