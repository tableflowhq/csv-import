import React from "react";
import { Input, PillInput } from "@tableflow/ui-library";
import style from "../style/Validation.module.scss";
import ValidationOptionsEnum from "./ValidationOptionsEnum";

const ValidationOptions = ({ dataType, validationOption, handleDataTypeChange, handleValidationChange }: any) => {
  const stringOptions = {
    Regex: {
      value: "regex",
    },
    Email: {
      value: "email",
    },
    List: {
      value: "list",
    },
    Phone: {
      value: "phone",
    },
    Length: {
      value: "length",
    },
  };

  const numberOptions = {
    Range: {
      value: "range",
    },
  };

  return (
    <div>
      <Input
        placeholder="Select a type"
        options={{
          String: {
            value: "String",
          },
          Number: {
            value: "Number",
          },
        }}
        label="Data Type"
        name="data_type"
        value={dataType}
        onChange={handleDataTypeChange}
      />
      <Input
        placeholder="Select"
        options={dataType === "String" ? stringOptions : numberOptions}
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
