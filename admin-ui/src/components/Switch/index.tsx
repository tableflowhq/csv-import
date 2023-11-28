
import { SwitchProps } from "./types";
import styles from "./styles/Switch.module.scss";
import classes from "../../utils/classes";

export default function Switch({ className, label, inputFirst, ...props }: SwitchProps) {
    const labelElement = <span className={styles.label}>{label}</span>;

    return (
        <>
            <label className={classes([styles.container, className])}>
                {!inputFirst && labelElement}
                <input type="checkbox" {...props} />
                <span className={classes([styles.slider])} />
                {inputFirst && labelElement}
            </label>
        </>
    );
}
