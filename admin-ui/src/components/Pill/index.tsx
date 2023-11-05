import { useEffect, useState } from "react";
import classes from "../../utils/classes";
import { PillProps } from "./types";
import style from "./style/Pill.module.scss";
import Icon from "../Icon";

export default function PillInput({ label, className, error, variants = [], placeholder, initialPills = [], onChange, ...props }: PillProps) {
  const [pills, setPills] = useState<string[]>(initialPills);
  const [inputValue, setInputValue] = useState("");

  const variantStyles = classes(variants.map((c: string) => style[c]));
  const inputWrapperClassName = classes([style.inputWrapper, variantStyles, className]);

  const handleInputChange = (event: any) => {
    setInputValue(event.target.value);
  };

  const handleKeyDown = (event: any) => {
    if ([",", "Enter"].includes(event.key) && inputValue.trim()) {
      setPills([...pills, inputValue.trim()]);
      setInputValue("");
      event.preventDefault();
    }
    if (event.key === "Backspace" && !inputValue) {
      handleRemovePill(pills.length - 1);
    }
  };

  const onBlur = () => {
    if (inputValue.trim()) {
      setPills([...pills, inputValue.trim()]);
      setInputValue("");
    }
  };

  useEffect(() => {
    onChange?.(pills);
  }, [pills]);

  const handleRemovePill = (indexToRemove: any) => {
    setPills(pills.filter((_, index) => index !== indexToRemove));
  };

  const iconElement = (
    <span className={style.icon}>
      <Icon icon="cross" />
    </span>
  );

  const inputWrapper = (
    <div className={classes([inputWrapperClassName, error && style.hasError])}>
      {pills.map((pill, index) => (
        <div key={index} className={style.pill}>
          {pill}
          <span onClick={() => handleRemovePill(index)}>{iconElement}</span>
        </div>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        placeholder={pills.length === 0 ? placeholder : ""}
        style={{ width: pills.length ? `${inputValue.length + 1.5}ch` : "100%" }}
        {...props}
      />
    </div>
  );

  return (
    <div className={style.container}>
      <label>
        {label ? <span className={style.label}>{label}</span> : null}
        {inputWrapper}
      </label>
    </div>
  );
}
