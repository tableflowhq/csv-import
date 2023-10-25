import React, { useState } from "react";
import { Input, PillInput } from "@tableflow/ui-library";
import { InputOption } from "@tableflow/ui-library/build/Input/types";
import style from "../style/Validation.module.scss";
import ValidationOptionsEnum from "./ValidationOptionsEnum";

type ValidationOptionsType = Record<string, string[]>;

const ValidationOptions = ({ dataType, validationOption, handleDataTypeChange, handleValidationChange }: any) => {
  const [validations, setValidations] = useState({});

  //TODO: this is a mock from backend
  const validationOptions: ValidationOptionsType = {
    string: ["regex", "email", "list", "phone", "length"],
    number: ["range"],
  };

  const capitalizeFirstLetter = (str: string) => {
    return str?.charAt(0)?.toUpperCase() + str?.slice(1);
  };

  const generateDataTypeOptions = (validationOptions: any) => {
    const inputOptions: { [key: string]: { value: string } } = {};
    for (const key in validationOptions) {
      const keyOption = capitalizeFirstLetter(key);
      inputOptions[keyOption] = {
        value: key,
      };
    }
  
    return inputOptions;
  }

  const getValidationOptions = (validationOptions: any) => {
    const inputOptions = {} as any;
  
    for (const key of validationOptions) {
    const keyOption = capitalizeFirstLetter(key);
      inputOptions[keyOption] = {
        value: key,
      };
    }
  
    return inputOptions;
  }

  const inputOptions = generateDataTypeOptions(validationOptions);

  const handleDataType = (value: any) => {
    const options = getValidationOptions(validationOptions[value]);
    setValidations(options);
    handleDataTypeChange(value);
  };

  return (
    <div>
      <Input
        placeholder="Select a type"
        options={inputOptions}
        label="Data Type"
        name="data_type"
        value={dataType}
        onChange={handleDataType}
      />
      <Input
        placeholder="Select"
        options={validations}
        label="Validation"
        name="validation"
        value={validationOption}
        onChange={handleValidationChange}
      />
      <div>
        {validationOption === ValidationOptionsEnum.Regex ? (
          <Input placeholder="Pattern" label="Pattern" name="pattern" />
        ) : validationOption === ValidationOptionsEnum.List ? (
          <label>
            <PillInput label={"Options"} placeholder={"List"} />
          </label>
        ) : validationOption === ValidationOptionsEnum.Length || validationOption === ValidationOptionsEnum.Range ? (
          <div className={style.rangeControl}>
            <div className={style.inputWrapper}>
              <Input placeholder="Minimum" label="Minimum" name="minimum" variants={["small"]} />
            </div>
            <div className={style.inputSeparator}>-</div>
            <div className={style.inputWrapper}>
              <Input placeholder="Maximum" label="Maximum" name="maximum" variants={["small"]} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ValidationOptions;
