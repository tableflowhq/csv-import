import { useEffect } from "react";
import Badge from "../../../components/Badge";
import Button from "../../../components/Button";
import useDeleteImporter from "../../../api/useDeleteImporter";
import { sizes } from "../../../settings/theme";
import { ImporterDeleteProps } from "../types";
import style from "../style/DeleteConfirmation.module.scss";
import { PiTrash } from "react-icons/pi";

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
          <PiTrash className={style.iconRed} size={sizes.icon.large} />
        </div>
        <div className={style.texts}>
          <h3>Delete Importer</h3>
          <p>
            Are you sure you want to delete <Badge variants={["deep"]}>{importer?.name}</Badge>? Any applications using this importer will no longer
            work. This action cannot be undone.
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
