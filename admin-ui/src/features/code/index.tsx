import getCode from "./utils/getCode";
import { CodeProps } from "./types";
import style from "./style/Code.module.scss";

export default function Code(props: CodeProps) {
  return (
    <div className={style.container}>
      <div className={style.top}>
        <p>Copy and paste the code below into your application:</p>
      </div>
      <textarea defaultValue={getCode(props)} readOnly />
    </div>
  );
}
