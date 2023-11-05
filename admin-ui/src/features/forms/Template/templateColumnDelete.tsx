import { useEffect } from "react";
import Badge from "../../../components/Badge";
import Button from "../../../components/Button";
import Icon from "../../../components/Icon";
import useDeleteTemplateColumn from "../../../api/useDeleteTemplateColumn";
import { TemplateDeleteProps } from "../types";
import style from "../style/DeleteConfirmation.module.scss";

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
          <Icon icon="trash" size="m" className={style.iconRed} />
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
