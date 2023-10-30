import React, { useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import { Icon, Input, PillInput, Tooltip } from "@tableflow/ui-library";
import style from "../style/Validation.module.scss";
import ValidationOptionsEnum from "./ValidationOptionsEnum";

type ValidationOptionsType = Record<string, string[]>;

interface ValidationOptionsProps {
  dataType: string;
  selectedValidation: string;
  validateOptions: string | string[] | { min?: number | string; max?: number | string };
  handleDataTypeChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleValidationChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleValidateOptionsChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  form: any;
}

interface LengthOptions {
  min?: number | string;
  max?: number | string;
}

const ValidationOptions = ({
  dataType,
  selectedValidation,
  validateOptions,
  handleDataTypeChange,
  handleValidationChange,
  handleValidateOptionsChange,
  form,
}: ValidationOptionsProps) => {
  const [validationsOptions, setValidationsOptions] = useState({});
  const [minimumValue, setMinimumValue] = useState("");
  const [maximumValue, setMaximumValue] = useState("");
  const [localRegex, setLocalRegex] = useState(typeof validateOptions !== "object" ? validateOptions : "");

  //TODO: this is a mock from backend
  const validationOptions: ValidationOptionsType = {
    string: ["regex", "email", "list", "phone", "length"],
    number: ["range"],
  };

  const capitalizeFirstLetter = (str: string) => {
    return str?.charAt(0)?.toUpperCase() + str?.slice(1);
  };

  const getOptionsFromObject = (validationOptions: any) => {
    const inputOptions = {} as any;

    for (const key of validationOptions) {
      const keyOption = capitalizeFirstLetter(key);
      inputOptions[keyOption] = {
        value: key,
      };
    }

    return inputOptions;
  };

  useEffect(() => {
    if (dataType) {
      const options = getOptionsFromObject(validationOptions[dataType]);
      setValidationsOptions(options);
    }
  }, []);

  useEffect(() => {
    updateValidateOptions();
  }, [minimumValue, maximumValue]);

  useEffect(() => {
    if (typeof validateOptions === "object" && "min" in validateOptions) {
      setMinimumValue(validateOptions.min?.toString() || "");
    }
    if (typeof validateOptions === "object" && "max" in validateOptions) {
      setMaximumValue(validateOptions.max?.toString() || "");
    }
  }, [validateOptions]);

  const inputOptions = getOptionsFromObject(Object.keys(validationOptions));

  const onDataTypeChange = (value: any) => {
    const options = value ? getOptionsFromObject(validationOptions[value]) : [];
    setValidationsOptions(options);
    setMaximumValue("");
    setMinimumValue("");
    form.setFieldValue("data_type", value);
    handleDataTypeChange(value);
  };

  const onValidationInputChange = ({ target }: any) => {
    const { value } = target;
    setLocalRegex(value);
    form.setFieldValue("pattern", value);
    handleValidateOptionsChange(value);
  };

  const onValidationPillChange = (value: any) => {
    handleValidateOptionsChange(value);
  };

  const onMinimumChange = (event: any) => {
    form.setFieldValue("validation_option", event.target.value);
    setMinimumValue(event.target.value);
  };

  const onMaximumChange = (event: any) => {
    form.setFieldValue("validation_option", event.target.value);
    setMaximumValue(event.target.value);
  };

  const updateValidateOptions = () => {
    let updatedOptions: LengthOptions = {};
    if (selectedValidation === ValidationOptionsEnum.Length || selectedValidation === ValidationOptionsEnum.Range) {
      if (minimumValue) {
        updatedOptions["min"] = parseInt(minimumValue);
      }
      if (maximumValue) {
        updatedOptions["max"] = parseInt(maximumValue);
      }
    }
    handleValidateOptionsChange(updatedOptions as any);
  };

  const renderInputPattern = () => (
    <Input
      placeholder="Pattern"
      label="Pattern"
      name="pattern"
      {...form.getInputProps("pattern")}
      onChange={onValidationInputChange}
      value={localRegex}
    />
  );

  const renderInputList = () => (
    <label>
      <PillInput
        label="Options"
        placeholder="List"
        onChange={onValidationPillChange}
        initialPills={Array.isArray(validateOptions) ? validateOptions : []}
      />
    </label>
  );

  const renderRangeControl = () => (
    <div className={style.rangeControl}>
      <div className={style.inputWrapper}>
        <Input
          placeholder="Minimum"
          label="Minimum"
          name="minimum"
          variants={["small"]}
          onChange={onMinimumChange}
          value={minimumValue}
        />
      </div>
      <div className={style.inputSeparator} />
      <div className={style.inputWrapper}>
        <Input
          placeholder="Maximum"
          label="Maximum"
          name="maximum"
          variants={["small"]}
          onChange={onMaximumChange}
          value={maximumValue}
        />
      </div>
    </div>
  );

  return (
    <div>
      <Input
        placeholder="Select a type"
        options={inputOptions}
        label={
          <div className={style.formLabel}>
            <span>Data Type</span>
            <Tooltip className={style.formTooltip} title={"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, diam, quisque."} />
          </div>
        }
        name="data_type"
        value={dataType}
        {...form.getInputProps("data_type")}
        onChange={onDataTypeChange}
      />
      <Input
        placeholder="Select"
        options={validationsOptions}
        name="validation"
        value={selectedValidation}
        label={
          <div className={style.formLabel}>
            <span>Validation</span>
            <Tooltip className={style.formTooltip} title={"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, diam, quisque."} />
          </div>
        }
        {...form.getInputProps("validation.validate")}
        onChange={(value: any) => {
          form.setFieldValue("validation.validate", value);
          handleValidationChange(value);
        }}
      />
      <>
        {!selectedValidation && (
          <div className={style.validationPlaceholder}>
            <Icon icon="info" className={style.placeholderIcon} /> Options will become visible once you select the column type.
          </div>
        )}
        {selectedValidation === ValidationOptionsEnum.Regex && renderInputPattern()}
        {selectedValidation === ValidationOptionsEnum.List && renderInputList()}
        {(selectedValidation === ValidationOptionsEnum.Length || selectedValidation === ValidationOptionsEnum.Range) && renderRangeControl()}
      </>
    </div>
  );
};

export default ValidationOptions;
