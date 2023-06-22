import { useEffect } from "react";
import { Badge, Button, Icon } from "@tableflowhq/ui-library";
import useDeleteImporter from "../../../api/useDeleteImporter";
import { ImporterDeleteProps } from "../types";
import style from "../style/DeleteConfirmation.module.scss";

export default function ImporterDelete({ importer, onSuccess = () => null, context }: ImporterDeleteProps) {
  const { mutate, isLoading, isSuccess } = useDeleteImporter(context?.workspaceId, importer?.id);

  const onDeleteConfirm = () => {
    mutate(importer?.id);
    onSuccess();
  };

  useEffect(() => {
    if (isSuccess && onSuccess) onSuccess();
  }, [isSuccess]);

  return (
    <>
      <div className={style.top}>
        <div className={style.icon}>
          <Icon icon="trash" size="m" className={style.iconRed} />
        </div>
        <div className={style.texts}>
          <h3>Delete Importer</h3>
          <p>
            Are you sure you want to delete <Badge variants={["deep"]}>{importer?.name}</Badge>? The action cannot be undone.
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
