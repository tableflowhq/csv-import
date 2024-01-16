import { useEffect, useState } from "react";
import classes from "../../utils/classes";
import { Option, ToggleFilterProps } from "./types";
import style from "./style/ToggleFilter.module.scss";

function ToggleFilter({ options, onChange, className }: ToggleFilterProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const toggleFilterClassName = classes([style.toggleFilter, className]);

  useEffect(() => {
    const defaultSelected = options.find((option) => option.selected);
    setSelectedOption(defaultSelected ? defaultSelected.label : options[0]?.label);
  }, [options]);

  const handleClick = (option: Option) => {
    setSelectedOption(option.label);
    if (onChange) {
      onChange(option.filterValue);
    }
  };

  const getOptionColor = (option: Option) => {
    if (option.color) {
      return option.color;
    }
    return selectedOption === option.label ? "var(--color-tertiary)" : "var(--color-text)";
  };

  return (
    <div className={toggleFilterClassName}>
      {options.map((option) => (
        <button
          key={option.label}
          className={classes([
            style.toggleOption,
            selectedOption === option.label && style.selected,
            option.color && style[option.color as keyof typeof style],
          ])}
          onClick={() => handleClick(option)}
          style={{ color: getOptionColor(option) }}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default ToggleFilter;
