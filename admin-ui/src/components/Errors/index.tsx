import classes from "../../utils/classes";
import style from "./style/Errors.module.scss";
import { PiInfo } from "react-icons/pi";

export default function Errors({ error, centered = false }: { error?: unknown; centered?: boolean }) {
  return error ? (
    <div className={classes([style.errors, centered ? style.centered : undefined])}>
      <p>
        <PiInfo />
        {error.toString()}
      </p>
    </div>
  ) : null;
}
