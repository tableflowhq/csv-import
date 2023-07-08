import TopBar from "../../top-bar";
import style from "./style/Centered.module.scss";

export default function Centered({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className={style.container}>
      <TopBar />
      <div className={style.content}>{children}</div>
    </div>
  );
}
