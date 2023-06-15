import { useEffect } from "react";
import { Badge, Button, Icon } from "@tableflowhq/ui-library";
import useDeleteUser from "../../../api/useDeleteUser";
import { UserDeleteProps } from "../types";
import style from "../style/DeleteConfirmation.module.scss";

export default function UserDelete({ user, onSuccess = () => null }: UserDeleteProps) {
  const { mutate, isLoading, isSuccess } = useDeleteUser();

  const onDeleteConfirm = () => {
    mutate(user?.id);
    onSuccess();
  };

  useEffect(() => {
    if (isSuccess && onSuccess) onSuccess();
  }, [isSuccess]);

  return (
    <>
      <div className={style.top}>
        <div className={style.icon}>
          <Icon icon="trash" />
        </div>
        <div className={style.texts}>
          <h3>Delete User</h3>
          <p>
            Are you sure you want to delete <Badge variants={["deep"]}>{user?.email}</Badge>? The action cannot be undone.
          </p>
        </div>
      </div>

      <fieldset disabled={isLoading} className={style.actions}>
        <Button type="button" onClick={onSuccess}>
          Cancel
        </Button>
        <Button variants={["warning"]} type="button" onClick={onDeleteConfirm}>
          Delete
        </Button>
      </fieldset>
    </>
  );
}
