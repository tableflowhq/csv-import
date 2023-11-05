import { useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import Button from "../../../components/Button";
import Checkbox from "../../../components/Checkbox";
import Errors from "../../../components/Errors";
import Input from "../../../components/Input";
import PillInput from "../../../components/Pill";
import Tooltip from "../../../components/Tooltip";
import { TemplateColumn } from "../../../api/types";
import usePostTemplateColumn from "../../../api/usePostTemplateColumn";
import classes from "../../../utils/classes";
import { TemplateColumnProps } from "../types";
import style from "../style/Form.module.scss";
import ValidationOptions from "./validationOptions";
import ValidationOptionsEnum from "./ValidationOptionsEnum";

export default function TemplateColumnForm({
  title = "Template column form",
  column = {} as TemplateColumn,
  onSuccess,
  context,
}: TemplateColumnProps) {
  const isEditForm = !!column?.id;
  const [userModifiedKey, setUserModifiedKey] = useState(false);
  const validationOptionsArray: string[] = Object.values(ValidationOptionsEnum);
  const [selectedValidation, setSelectedValidation] = useState(() => {
    if (column?.validations) {
      for (const validation of column.validations) {
        if (validationOptionsArray.includes(validation.validate)) {
          return validation?.validate;
        }
      }
    }
    return "";
  });

  const getSavedValidationOptions = () => {
    if (column?.validations && selectedValidation) {
      const matchingValidation = column.validations.find((validation) => validation?.validate === selectedValidation);
      if (matchingValidation && matchingValidation.options) {
        return matchingValidation.options;
      }
    }
    return "";
  };

  const form = useForm({
    initialValues: {
      id: column?.id || "",
      template_id: context?.templateId || "",
      name: column?.name || "",
      description: column?.description || "",
      key: column?.key || "",
      required: column?.required || false,
      not_blank: (column?.validations && column?.validations.some((v) => v.validate === "not_blank")) || false,
      suggested_mappings: column?.suggested_mappings || [],
      data_type: column?.data_type || "string",
      validation_option: false,
      validations: {
        validate: selectedValidation || "",
      },
    },
  });
  const { mutate, isLoading, error, isSuccess } = usePostTemplateColumn(context?.templateId, column?.id);
  const [dataType, setDataType] = useState(column?.data_type || "string");

  const [validateOptions, setValidateOptions] = useState(() => getSavedValidationOptions());

  useEffect(() => {
    if (isSuccess && !error && !isLoading && onSuccess) onSuccess();
  }, [isSuccess, error, isLoading]);

  const onSubmit = (values: any) => {
    const savedOptions = getSavedValidationOptions();
    values.validations = [];

    if (values.not_blank) {
      values.validations = [{ validate: "not_blank" }];
    }

    if (selectedValidation) {
      const validateOption: { validate: string; options?: string } = {
        validate: selectedValidation,
        options: Object.keys(validateOptions).length ? validateOptions : savedOptions,
      };

      if (selectedValidation === ValidationOptionsEnum.Email || selectedValidation === ValidationOptionsEnum.Phone) {
        delete validateOption.options;
      }

      values.validations.push(validateOption);
    }

    mutate({ ...values, data_type: dataType });
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

  const handleDataTypeChange = (value: any) => {
    setDataType(value);
    setSelectedValidation("");
    setValidateOptions("");
  };

  const handleValidationChange = (value: any) => {
    setSelectedValidation(value);
    setValidateOptions("");
  };

  const handleValidateOptionsChange = (value: any) => {
    setValidateOptions(value);
  };

  return (
    <div className={style.extendedContainer}>
      {title && (
        <div className={style.title}>
          <h2>{title}</h2>
        </div>
      )}
      <form onSubmit={form.onSubmit(onSubmit)} aria-disabled={isLoading}>
        <div className={style.formControls}>
          <fieldset disabled={isLoading} className={style.column}>
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
            <div className={style.checkboxInput}>
              <label>
                <Checkbox {...form.getInputProps("not_blank", { type: "checkbox" })} />
                <span className={style.checkboxLabel}>Cells must contain a value</span>
              </label>
              <Tooltip
                className={style.checkboxLabel}
                title={"Every cell in this column must contain data. Empty cells will prevent users from completing the import"}
              />
            </div>
          </fieldset>

          <fieldset disabled={isLoading} className={style.column}>
            <div className={style.titleContainer}>
              <h2 className={style.subTitle}>Validation Options</h2>
            </div>
            <ValidationOptions
              dataType={dataType}
              selectedValidation={selectedValidation}
              validateOptions={validateOptions}
              form={form}
              handleDataTypeChange={handleDataTypeChange}
              handleValidationChange={handleValidationChange}
              handleValidateOptionsChange={handleValidateOptionsChange}
            />
          </fieldset>
        </div>

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
