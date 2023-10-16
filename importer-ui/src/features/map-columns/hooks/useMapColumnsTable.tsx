import { useEffect, useMemo, useState } from "react";
import Checkbox from "../../../components/Checkbox";
import Input from "../../../components/Input";
import { InputOption } from "../../../components/Input/types";
import DropdownFields from "../components/DropDownFields";
import { TemplateColumn, UploadColumn } from "../../../api/types";
import style from "../style/MapColumns.module.scss";
import useTransformValue from "./useNameChange";

type Include = {
  template: string;
  use: boolean;
  selected?: boolean;
};

export default function useMapColumnsTable(
  items: UploadColumn[] = [],
  templateColumns: TemplateColumn[] = [],
  schemaless?: boolean,
  schemalessReadOnly?: boolean,
  columnsValues: { [key: string]: Include } = {}
) {
  useEffect(() => {
    Object.keys(columnsValues).map((mapColData) => {
      const template = columnsValues[mapColData].template;
      handleTemplateChange(mapColData, template);
    });
  }, []);

  const [values, setValues] = useState<{ [key: string]: Include }>(() => {
    return items.reduce(
      (acc, uc) => ({
        ...acc,
        [uc.id]: {
          template: uc?.suggested_template_column_id || "",
          use: !!uc?.suggested_template_column_id,
          selected: !!uc?.suggested_template_column_id,
        },
      }),
      {}
    );
  });

  const [selectedValues, setSelectedValues] = useState<{ template: string; selected: boolean | undefined }[]>(
    Object.values(values).map(({ template, selected }) => ({ template, selected }))
  );

  const templateFields: { [key: string]: InputOption } = useMemo(
    () => templateColumns.reduce((acc, field) => ({ ...acc, [field.name]: { value: field.id, required: field.required } }), {}),
    [JSON.stringify(templateColumns)]
  );

  const handleTemplateChange = (id: string, template: string) => {
    setValues((prev) => {
      const templatesFields = { ...prev, [id]: { ...prev[id], template, use: !!template, selected: !!template } };
      const templateFieldsObj = Object.values(templatesFields).map(({ template, selected }) => ({ template, selected }));
      setSelectedValues(templateFieldsObj);
      return templatesFields;
    });
  };

  const handleUseChange = (id: string, value: boolean) => {
    setValues((prev) => ({ ...prev, [id]: { ...prev[id], use: !!prev[id].template && value } }));
  };

  const handleValueChange = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: { ...prev[id], template: value, use: !!value } }));
  };

  const rows = useMemo(() => {
    return items.map((item) => {
      const { id, name, sample_data } = item;
      const suggestion = values?.[id] || {};
      const samples = sample_data.filter((d) => d);
      const transformedName = name
        .replace(/\s/g, "_")
        .replace(/[^a-zA-Z0-9_]/g, "")
        .toLowerCase();

      return {
        "Your File Column": {
          raw: name || false,
          content: name || <em>- empty -</em>,
        },
        "Your Sample Data": {
          raw: "",
          content: (
            <div title={samples.join(", ")} className={style.samples}>
              {samples.map((d, i) => (
                <small key={i}>{d}</small>
              ))}
            </div>
          ),
        },
        "Destination Column": {
          raw: "",
          content: schemaless ? (
            <SchemalessInput
              value={transformedName}
              setValues={(value) => {
                handleValueChange(id, value);
              }}
              readOnly={!!schemalessReadOnly}
            />
          ) : (
            <DropdownFields
              options={templateFields}
              value={suggestion.template}
              placeholder="- Select one -"
              onChange={(template: string) => handleTemplateChange(id, template)}
              selectedValues={selectedValues}
              updateSelectedValues={setSelectedValues}
            />
          ),
        },
        Include: {
          raw: false,
          content: (
            <Checkbox
              checked={suggestion.use}
              disabled={(schemaless && schemalessReadOnly) || !suggestion.template}
              onChange={(e) => handleUseChange(id, e.target.checked)}
            />
          ),
        },
      };
    });
  }, [values]);
  return { rows, formValues: values };
}

const SchemalessInput = ({ value, setValues, readOnly }: { value: string; setValues: (value: string) => void; readOnly: boolean }) => {
  const { transformedValue, transformValue } = useTransformValue(value);
  const [inputValue, setInputValue] = useState(transformedValue);

  useEffect(() => {
    setInputValue(transformedValue);
    setValues(transformedValue);
  }, [transformedValue]);

  const handleOnChange = (e: any) => {
    transformValue(e.target.value);
    setInputValue(e.target.value);
    setValues(transformedValue);
  };

  return <Input value={inputValue} variants={["small"]} onChange={handleOnChange} disabled={readOnly} />;
};
