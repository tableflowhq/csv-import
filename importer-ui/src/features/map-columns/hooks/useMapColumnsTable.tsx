import { useEffect, useMemo, useState } from "react";
import { Checkbox, Input } from "@tableflow/ui-library";
import { InputOption } from "@tableflow/ui-library/build/Input/types";
import { TemplateColumn, UploadColumn } from "../../../api/types";
import stringsSimilarity from "../../../utils/stringSimilarity";
import style from "../style/MapColumns.module.scss";
import useTransformValue from "./useNameChange";

type Include = {
  template: string;
  use: boolean;
};

export default function useMapColumnsTable(
  items: UploadColumn[] = [],
  templateColumns: TemplateColumn[] = [],
  schemaless?: boolean,
  schemalessReadOnly?: boolean,
  columnsValues: { [key: string]: Include } = {}
) {
  const [selectedFieldsSet, setSelectedFieldsSet] = useState(() => {
    const selectedFields = Object.values(columnsValues).map((value) => ({
      template: value.template,
      use: value.use,
    }));
    return new Set(selectedFields);
  });

  useEffect(() => {
    Object.keys(columnsValues).map((mapColData) => {
      const template = columnsValues[mapColData].template;
      handleTemplateChange(mapColData, template);
    });
  }, []);

  const [values, setValues] = useState<{ [key: string]: Include }>(() => {
    return items.reduce(
      (acc, uc) => ({ ...acc, [uc.id]: { template: uc?.suggested_template_column_id || "", use: !!uc?.suggested_template_column_id } }),
      {}
    );
  });
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const templateFields: { [key: string]: InputOption } = useMemo(
    () => templateColumns.reduce((acc, field) => ({ ...acc, [field.name]: { value: field.id, required: field.required } }), {}),
    [JSON.stringify(templateColumns)]
  );

  const handleTemplateChange = (id: string, template: string) => {
    setValues((prev) => {
      const oldTemplate = prev[id]?.template;
      setSelectedTemplates((currentSelected) => {
        if (currentSelected.includes(oldTemplate)) {
          return currentSelected.filter((t) => t !== oldTemplate);
        }
        if (template && !currentSelected.includes(template)) {
          return [...currentSelected, template];
        }
        return currentSelected;
      });
      const idTemplate = oldTemplate || template;
      const updatedFieldsSet = new Set(
        [...selectedFieldsSet].map((field) => {
          if (field.template === idTemplate) {
            return { ...field, use: !!template };
          }
          return field;
        })
      );
      setSelectedFieldsSet(updatedFieldsSet);
      return { ...prev, [id]: { ...prev[id], template, use: !!template } };
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

      const filteredUsedValues = Object.entries(values).reduce((acc, [key, value]) => {
        if (value.use && key !== id) {
          acc[key] = value;
        }
        return acc;
      }, {} as { [key: string]: Include });

      let currentOptions;

      if (selectedTemplates && selectedTemplates.length > 0) {
        currentOptions = Object.keys(templateFields).filter((key) => {
          const isTemplateSelected = selectedTemplates.includes(templateFields[key].value as string);
          const isSuggestionTemplate = templateFields[key].value === suggestion.template;
          return !isTemplateSelected || isSuggestionTemplate;
        });
      } else {
        if (suggestion.use) {
          setSelectedTemplates((prevTemplates) => [...prevTemplates, suggestion.template]);
        }
        currentOptions = Object.keys(templateFields).filter((key) => {
          const isSuggestionTemplate = templateFields[key].value === suggestion.template;
          const isTemplateUsed = Object.values(filteredUsedValues).some((val) => val.template === templateFields[key].value);
          return !isTemplateUsed || isSuggestionTemplate;
        });
      }
      if (selectedFieldsSet.size > 0) {
        currentOptions = Object.keys(templateFields).filter((key) => {
          const isSuggestionTemplate = templateFields[key].value === suggestion.template;
          const isTemplateUsed = Array.from(selectedFieldsSet).some((val) => val.template === templateFields[key].value && val.use);
          return !isTemplateUsed || isSuggestionTemplate;
        });
      }

      currentOptions = currentOptions?.reduce((acc, key) => {
        acc[key] = templateFields[key];
        return acc;
      }, {} as { [key: string]: InputOption });
      const isCurrentOptions = currentOptions && Object.keys(currentOptions).length > 0;

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
            <Input
              options={currentOptions}
              value={suggestion.template}
              placeholder="- Select one -"
              variants={["small"]}
              onChange={(template: any) => handleTemplateChange(id, template)}
              disabled={!isCurrentOptions}
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
