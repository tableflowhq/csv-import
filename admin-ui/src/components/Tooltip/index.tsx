import classes from "../../utils/classes";
import getStringLengthOfChildren from "../../utils/getStringLengthOfChildren";
import { AsMap, TooltipProps } from "./types";
import style from "./style/Tooltip.module.scss";
import Icon from "../Icon";

export default function Tooltip<T extends keyof AsMap>({ as, className, title, children, ...props }: TooltipProps<T>) {
  const Tag: any = as || "span";

  const length = getStringLengthOfChildren(title);
  const wrapperClasses = classes([style.tooltip, className, length > 30 && style.multiline]);

  return (
    <Tag {...props} className={wrapperClasses}>
      {children}
      <span className={style.icon}>
        <Icon icon="info" />
        <span className={style.message}>{title}</span>
      </span>
    </Tag>
  );
}
