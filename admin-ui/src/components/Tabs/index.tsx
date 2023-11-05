import classes from "../../utils/classes";
import { TabsProps } from "./types";
import style from "./style/Tabs.module.scss";

export default function Tabs({ tabs, tab, setTab, onChange, children }: TabsProps) {
  return (
    <>
      <div className={style.tabs}>
        {Object.keys(tabs).map((k) => (
          <button
            key={k}
            type="button"
            className={classes([style.tabBtn, k === tab && style.active])}
            onClick={() => {
              if (setTab) setTab(k);
              if (onChange) onChange(k);
            }}
            disabled={k === tab}>
            {tabs[k]}
          </button>
        ))}
      </div>
      {children && <div className={classes([style.tabContent, style.active])}>{children}</div>}
    </>
  );
}
