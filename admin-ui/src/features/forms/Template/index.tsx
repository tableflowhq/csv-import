import { useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import { Button, Checkbox, classes, Errors, Input, PillInput, Tooltip } from "@tableflow/ui-library";
import { TemplateColumn } from "../../../api/types";
import usePostTemplateColumn from "../../../api/usePostTemplateColumn";
import { TemplateColumnProps } from "../types";
import style from "../style/Form.module.scss";

export default function TemplateColumnForm({
  title = "Template column form",
  column = {} as TemplateColumn,
  onSuccess,
  context,
}: TemplateColumnProps) {
  const isEditForm = !!column?.id;
  const [userModifiedKey, setUserModifiedKey] = useState(false);
  const form = useForm({
    initialValues: {
      id: column?.id || "",
      template_id: context?.templateId || "",
      name: column?.name || "",
      description: column?.description || "",
      key: column?.key || "",
      required: column?.required || false,
      filled: (column?.validations && column?.validations.length !== 0) || false,
      suggested_mappings: column?.suggested_mappings || [],
    },
  });
  const { mutate, isLoading, error, isSuccess } = usePostTemplateColumn(context?.templateId, column?.id);

  useEffect(() => {
    if (isSuccess && !error && !isLoading && onSuccess) onSuccess();
  }, [isSuccess, error, isLoading]);

  const onSubmit = (values: any) => {
    // Note the validation logic here and "filled" in the form will be removed once we support multiple validations
    const hasExistingValidation = column?.validations && column?.validations.length !== 0;
    values.validations = null;
    if (values.filled && !hasExistingValidation) {
      // If filled is selected and there is no existing validation, add the validation to the request
      values.validations = [{ type: "filled" }];
    } else if (hasExistingValidation) {
      // If filled is not selected and the validation exists, add an empty validation array so the backend will remove it
      values.validations = [];
    }
    mutate(values);
  };

  const onNameChange = ({ target }: any) => {
    const { value } = target;
    if (value.length === 0 && form.getInputProps("key").value.length === 0) {
      setUserModifiedKey(false);
    }
    form.setFieldValue("name", value);
    if (!userModifiedKey) {
      let keyValue = value
        .replace(/\s/g, "_")
        .replace(/[^a-zA-Z0-9_]/g, "")
        .toLowerCase();
      form.setFieldValue("key", keyValue);
    }
  };

  const onKeyChange = ({ target }: any) => {
    const { value } = target;
    if (value.length === 0 && form.getInputProps("name").value.length === 0) {
      setUserModifiedKey(false);
    } else {
      setUserModifiedKey(true);
    }
    form.setFieldValue("key", value);
  };

  const onSuggestedMappingChange = (value: any) => {
    form.setFieldValue("suggested_mappings", value);
  };

  const requiredFieldEmpty = form.getInputProps("name").value.length === 0 || form.getInputProps("key").value.length === 0;

  return (
    <div className={style.container}>
      {title && (
        <div className={style.title}>
          <h2>{title}</h2>
        </div>
      )}
      <form onSubmit={form.onSubmit(onSubmit)} aria-disabled={isLoading}>
        <fieldset disabled={isLoading}>
          <Input
            placeholder={!isEditForm ? "Name" : `${column?.name}`}
            label="Name *"
            name="name"
            {...form.getInputProps("name")}
            autoFocus={!isEditForm}
            onChange={onNameChange}
            required
          />
          <Input
            placeholder={!isEditForm ? "Key" : `${column?.key}`}
            label="Key *"
            name="key"
            {...form.getInputProps("key")}
            onChange={onKeyChange}
            required
          />
          <Input as="textarea" placeholder="Description" label="Description" name="description" {...form.getInputProps("description")} />
          <div className={style.pillInputContainer}>
            <span>Suggested Mappings</span>
            <Tooltip
              className={style.checkboxLabel}
              title={
                "If a column header in the file matches one of these names (case-insensitive), it will be automatically selected during column mapping"
              }
            />
            <label>
              <PillInput
                placeholder={"Column mappings"}
                initialPills={form.getInputProps("suggested_mappings").value}
                onChange={onSuggestedMappingChange}
              />
            </label>
          </div>
          <div className={style.checkboxInput}>
            <label>
              <Checkbox {...form.getInputProps("required", { type: "checkbox" })} />
              <span className={style.checkboxLabel}>Column required</span>
            </label>
            <Tooltip className={style.checkboxLabel} title={"Users must map a column from their file to this column to proceed with the import"} />
          </div>
          {/*<div className={style.checkboxInput}>*/}
          {/*  <label>*/}
          {/*    <Checkbox {...form.getInputProps("filled", { type: "checkbox" })} />*/}
          {/*    <span className={style.checkboxLabel}>Cells must be filled</span>*/}
          {/*  </label>*/}
          {/*  <Tooltip*/}
          {/*    className={style.checkboxLabel}*/}
          {/*    title={"Every cell in this column must contain data. Empty cells will prevent users from completing the import"}*/}
          {/*  />*/}
          {/*</div>*/}
        </fieldset>

        <div className={classes([style.actions, style.compact])}>
          <Button type="submit" variants={["primary", "noMargin"]} disabled={isLoading || !form.isDirty() || requiredFieldEmpty}>
            {isLoading ? "Please wait..." : isEditForm ? "Save" : "Add"}
          </Button>
        </div>

        <Errors error={error} />
      </form>
    </div>
  );
}
