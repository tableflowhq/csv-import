import { useEffect } from "react";
import { useForm } from "@mantine/form";
import { Button, classes, Errors, Input } from "@tableflow/ui-library";
import { Importer } from "../../../api/types";
import usePostImporter from "../../../api/usePostImporter";
import { ImporterProps } from "../types";
import style from "../style/Form.module.scss";

export default function ImporterForm({ title = "Importer form", importer = {} as Importer, onSuccess, context }: ImporterProps) {
  const isEditForm = !!importer?.id;

  const form = useForm({
    initialValues: {
      id: importer?.id || "",
      name: importer?.name || "",
      workspace_id: context?.workspaceId || "",
    },
  });

  const { mutate, isLoading, error, isSuccess } = usePostImporter(context?.workspaceId, importer?.id);

  useEffect(() => {
    if (isSuccess && !error && !isLoading && onSuccess) onSuccess();
  }, [isSuccess, error, isLoading]);

  const onSubmit = (values: any) => {
    mutate(values);
  };

  const requiredFieldEmpty = form.getInputProps("name").value.length === 0;

  return (
    <div className={style.container}>
      {title && <h2>{title}</h2>}
      <form onSubmit={form.onSubmit(onSubmit)} aria-disabled={isLoading}>
        <fieldset disabled={isLoading}>
          <Input
            placeholder={!isEditForm ? "name" : `${importer?.name}`}
            name="name"
            {...form.getInputProps("name")}
            autoFocus={!isEditForm}
            className={style.sqlTextarea}
            required
          />
        </fieldset>

        <div className={classes([style.actions, style.compact])}>
          <Button type="submit" variants={["primary", "noMargin"]} disabled={isLoading || !form.isDirty() || requiredFieldEmpty}>
            {isLoading ? "Please wait..." : isEditForm ? "Save importer" : "Create"}
          </Button>
        </div>

        <Errors error={error} />
      </form>
    </div>
  );
}
