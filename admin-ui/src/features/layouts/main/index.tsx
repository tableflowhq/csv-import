import React from "react";
import { classes } from "@tableflow/ui-library";
import TopBar from "../../top-bar";
import style from "./style/Main.module.scss";

export default function Main({ center, children }: React.PropsWithChildren<{ center?: boolean }>) {
  return (
    <div className={style.container} data-layout="main">
      <TopBar />
      <div className={classes([style.content, center && style.center])}>{children}</div>
    </div>
  );
}
