import React, { useRef, useState } from "react";
import ReactFocusLock from "react-focus-lock";
import useClickOutside from "../../hooks/useClickOutside";
import { sizes } from "../../settings/theme";
import classes from "../../utils/classes";
import { DialogItem, DialogProps } from "./types";
import style from "./style/Dialog.module.scss";
import Button from "../Button";
import { PiDotsThreeVerticalBold } from "react-icons/pi";

export default function Dialog({
  icon = <PiDotsThreeVerticalBold size={sizes.icon.large} />,
  variants = ["bare"],
  iconPosition = "right",
  items,
  dialogPosition = "right",
  useActiveAsLabel,
  ...props
}: DialogProps): React.ReactElement {
  const [open, setOpen] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const handleClick = (item: DialogItem) => () => {
    item?.action && item.action(item.id || null);
    item?.onClick && item.onClick((item.id || null) as any);
    setOpen(false);
  };

  const containerClasses = classes([style.container, style[dialogPosition]]);
  const className = classes([style.menu]);

  const buttonProps = { icon, variants, iconPosition, className, ...props };

  return (
    <div ref={ref} className={containerClasses}>
      <Button {...buttonProps} type="button" onClick={() => setOpen(!open)}>
        {(useActiveAsLabel && items.find((item) => item.active)?.children) || props.children}
      </Button>

      {open && (
        <ReactFocusLock className={style.items}>
          {items.map((item, i) => {
            const { id, active, action, ...props } = item;

            return !active || !useActiveAsLabel ? (
              <Button
                {...props}
                variants={props.variants || ["bare", "alignLeft"]}
                type="button"
                key={i}
                onClick={handleClick(item)}
                className={classes([props?.className, style.item, active && style.active])}
                iconPosition={props?.iconPosition || "right"}>
                {item.children}
              </Button>
            ) : null;
          })}
        </ReactFocusLock>
      )}
    </div>
  );
}
