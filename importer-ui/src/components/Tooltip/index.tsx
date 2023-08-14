import { classes, Icon } from "@tableflow/ui-library";
import { AsMap, PropsWithAs } from "./types";
import style from "./style/Tooltip.module.scss";

export default function Tooltip<T extends keyof AsMap>({ as, className, title, children, ...props }: PropsWithAs<T>) {
  const Tag: any = as || "span";
  const wrapperClasses = classes([style.tooltip, className]);

  return (
    <Tag {...props} className={wrapperClasses}>
      {children}
      <span className={style.icon}>
        <Icon icon="help" />
        <span className={style.message}>{title}</span>
      </span>
    </Tag>
  );
}
