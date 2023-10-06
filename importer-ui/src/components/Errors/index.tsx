import style from "./style/Errors.module.scss";
import Icon from "../Icon";

export default function Errors({ error }: { error?: unknown }) {
  return error ? (
    <div className={style.errors}>
      <p>
        <Icon icon="error" />
        {error.toString()}
      </p>
    </div>
  ) : null;
}
