import React from "react";
import classes from "../../../utils/classes";
import style from "./style/Main.module.scss";
import Sidebar from "../../sidebar";

export default function Main({ center, children }: React.PropsWithChildren<{ center?: boolean }>) {
  return (
    <div className={style.container} data-layout="main">
      {/* <TopBar /> */}
      <div className={style.wrapper}>
        <Sidebar />
        <div className={classes([style.content, center && style.center])}>{children}</div>
      </div>
    </div>
  );
}


