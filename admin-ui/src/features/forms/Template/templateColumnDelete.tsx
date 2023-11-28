import { useEffect } from "react";
import Badge from "../../../components/Badge";
import Button from "../../../components/Button";
import useDeleteTemplateColumn from "../../../api/useDeleteTemplateColumn";
import { sizes } from "../../../settings/theme";
import { TemplateDeleteProps } from "../types";
import style from "../style/DeleteConfirmation.module.scss";
import { PiTrash } from "react-icons/pi";

export default function TemplateColumnDelete({ column, onSuccess = () => null, context }: TemplateDeleteProps) {
  const { mutate, isLoading, isSuccess } = useDeleteTemplateColumn(context?.templateId);

  const onDeleteConfirm = () => {
    mutate(column?.id);
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
          <h3>Delete Column</h3>
          <p>
            Are you sure you want to delete the column <Badge variants={["deep"]}>{column?.name}</Badge>? This action cannot be undone.
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
