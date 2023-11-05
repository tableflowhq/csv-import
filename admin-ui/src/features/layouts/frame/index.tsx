import Box from "../../../components/Box";
import TopBar from "../../top-bar";
import style from "./style/Frame.module.scss";

export default function Frame({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className={style.container}>
      <TopBar />
      <div className={style.content}>
        <Box>{children}</Box>
      </div>
    </div>
  );
}
