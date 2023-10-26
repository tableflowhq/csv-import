import React, { useEffect, useState } from "react";
import { Input, PillInput } from "@tableflow/ui-library";
import style from "../style/Validation.module.scss";
import ValidationOptionsEnum from "./ValidationOptionsEnum";

type ValidationOptionsType = Record<string, string[]>;

interface ValidationOptionsProps {
  dataType: string;
  validationOption: string;
  handleDataTypeChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleValidationChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

const ValidationOptions = ({ dataType, validationOption, handleDataTypeChange, handleValidationChange }: ValidationOptionsProps) => {
  const [validationsOptions, setValidationsOptions] = useState({});

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
  }, [])

  const inputOptions = getOptionsFromObject(Object.keys(validationOptions));

  const onDataTypeChange = (value: any) => {
    const options = value ? getOptionsFromObject(validationOptions[value]) : [];
    setValidationsOptions(options);
    handleDataTypeChange(value);
  };

  const renderInputPattern = () => <Input placeholder="Pattern" label="Pattern" name="pattern" />;

  const renderInputList = () => (
    <label>
      <PillInput label="Options" placeholder="List" />
    </label>
  );

  const renderRangeControl = () => (
    <div className={style.rangeControl}>
      <div className={style.inputWrapper}>
        <Input placeholder="Minimum" label="Minimum" name="minimum" variants={["small"]} />
      </div>
      <div className={style.inputSeparator}>-</div>
      <div className={style.inputWrapper}>
        <Input placeholder="Maximum" label="Maximum" name="maximum" variants={["small"]} />
      </div>
    </div>
  );

  return (
    <div>
      <Input placeholder="Select a type" options={inputOptions} label="Data Type" name="data_type" value={dataType} onChange={onDataTypeChange} />
      <Input
        placeholder="Select"
        options={validationsOptions}
        label="Validation"
        name="validation"
        value={validationOption}
        onChange={handleValidationChange}
      />
      <>
        {validationOption === ValidationOptionsEnum.Regex && renderInputPattern()}
        {validationOption === ValidationOptionsEnum.List && renderInputList()}
        {(validationOption === ValidationOptionsEnum.Length || validationOption === ValidationOptionsEnum.Range) && renderRangeControl()}
      </>
    </div>
  );
};

export default ValidationOptions;
