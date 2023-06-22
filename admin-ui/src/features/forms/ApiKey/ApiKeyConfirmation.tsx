import { Button, Icon } from "@tableflowhq/ui-library";
import { ApiKeyConfirmationProps } from "../types";
import style from "../style/DeleteConfirmation.module.scss";

export default function ApiKeyConfirmation({ onCancel, onConfirm = () => null }: ApiKeyConfirmationProps) {
  return (
    <>
      <div className={style.top}>
        <div className={style.icon}>
          <Icon icon="error" size="m" className={style.iconRed} />
        </div>
        <div className={style.texts}>
          <h3>Regenerate API Key</h3>
          <p>
            Are you sure you want to regenerate your API key? Any applications using this key will no longer be able to access the API until they are
            updated with the new key.
          </p>
          <p>This action cannot be undone.</p>
        </div>
      </div>

      <fieldset className={style.actions}>
        <Button type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variants={["primary"]} type="button" onClick={onConfirm}>
          Regenerate
        </Button>
      </fieldset>
    </>
  );
}
