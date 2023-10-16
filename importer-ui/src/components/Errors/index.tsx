import style from "./style/Errors.module.scss";
import { PiInfo } from "react-icons/pi";

export default function Errors({ error }: { error?: unknown }) {
  return error ? (
    <div className={style.errors}>
      <p>
        <PiInfo />
        {error.toString()}
      </p>
    </div>
  ) : null;
}
