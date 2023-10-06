import style from "./style/Errors.module.scss";
import { FaExclamation } from "react-icons/fa";

export default function Errors({ error }: { error?: unknown }) {
  return error ? (
    <div className={style.errors}>
      <p>
        <FaExclamation />
        {error.toString()}
      </p>
    </div>
  ) : null;
}
