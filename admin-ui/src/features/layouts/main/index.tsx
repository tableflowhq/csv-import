import React from "react";
import classes from "../../../utils/classes";
import TopBar from "../../top-bar";
import style from "./style/Main.module.scss";
import SimpleSidebar from "../../sidebar";

export default function Main({ center, children }: React.PropsWithChildren<{ center?: boolean }>) {
  return (
    <div className={style.container} data-layout="main">
      {/* <TopBar /> */}
      <div className={style.wrapper}>
        <SimpleSidebar />
        <div className={classes([style.content, center && style.center])}>{children}</div>
      </div>
    </div>
  );
}


