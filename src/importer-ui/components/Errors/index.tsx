import { sizes } from "../../settings/theme";
import classes from "../../utils/classes";
import style from "./style/Errors.module.scss";
import { PiInfo } from "react-icons/pi";

export default function Errors({ error, centered = false }: { error?: unknown; centered?: boolean }) {
  return error ? (
    <div className={classes([style.errors, centered ? style.centered : undefined])}>
      <p>
        <PiInfo size={sizes.icon.small} />
        {error.toString()}
      </p>
    </div>
  ) : null;
}
