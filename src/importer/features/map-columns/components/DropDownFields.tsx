import { useEffect, useState } from "react";
import Input from "../../../components/Input";
import { InputOption } from "../../../components/Input/types";

type DropdownFieldsProps = {
  options: { [key: string]: InputOption };
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  selectedValues: { key: string; selected: boolean | undefined }[];
  updateSelectedValues: (updatedValues: { key: string; selected: boolean | undefined }[]) => void;
};

export default function DropdownFields({ options, value, placeholder, onChange, selectedValues, updateSelectedValues }: DropdownFieldsProps) {
  const [selectedOption, setSelectedOption] = useState(value);
  const [filteredOptions, setFilteredOptions] = useState<{ [key: string]: InputOption }>({});

  useEffect(() => {
    setSelectedOption(value);
  }, [selectedValues]);

  useEffect(() => {
    filterOptions();
  }, [options, selectedValues]);

  const handleInputChange = (event: any) => {
    const newValue = event;
    const updatedSelectedValues = selectedValues.map((item) => {
      if (item.key === selectedOption) {
        return { ...item, selected: false };
      } else if (item.key === newValue) {
        return { ...item, selected: true };
      }
      return item;
    });
    setSelectedOption(newValue);
    updateSelectedValues([...updatedSelectedValues]);
    onChange(newValue);
  };

  const filterOptions = () => {
    const newFilteredOptions: { [key: string]: InputOption } = {};
    for (const key in options) {
      const option = options[key];
      const isSelected = selectedValues.some((item) => item.key === option?.value && item.selected && option.value !== value);
      if (!isSelected) {
        newFilteredOptions[key] = option;
      }
    }
    setFilteredOptions(newFilteredOptions);
  };

  return (
    <Input
      options={filteredOptions}
      value={selectedOption}
      placeholder={placeholder}
      variants={["small"]}
      onChange={handleInputChange}
      disabled={Object.keys(filteredOptions).length === 0}
    />
  );
}
