import { useMemo, useState } from "react";
import { Input, Switch } from "@tableflow/ui-library";
import { InputOption } from "@tableflow/ui-library/build/Input/types";
import { TemplateColumn, UploadColumn } from "../../../api/types";
import stringsSimilarity from "../../../utils/stringSimilarity";
import style from "../style/Review.module.scss";

type Include = {
  template: string;
  use: boolean;
};

export default function useReviewTable(items: UploadColumn[] = [], templateColumns: TemplateColumn[] = []) {
  const [values, setValues] = useState<{ [key: string]: Include }>(
    items.reduce((acc, item) => {
      const suggestion = templateColumns?.find((field) => stringsSimilarity(field.name, item.name) > 0.9)?.id || "";
      return { ...acc, [item.id]: { template: suggestion || "", use: !!suggestion } };
    }, {})
  );
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const templateFields: { [key: string]: InputOption } = useMemo(
    () => templateColumns.reduce((acc, field) => ({ ...acc, [field.name]: { value: field.id, required: field.required } }), {}),
    [JSON.stringify(templateColumns)]
  );

  const handleTemplateChange = (id: string, template: string) => {
    setValues((prev) => {
      const oldTemplate = prev[id].template;
      setSelectedTemplates((currentSelected) => {
        const newSelectedTemplates = currentSelected.filter((t) => t !== oldTemplate);
        if (template) {
          newSelectedTemplates.push(template);
        }
        return newSelectedTemplates;
      });

      return { ...prev, [id]: { ...prev[id], template, use: !!template } };
    });
  };

  const handleUseChange = (id: string, value: boolean) => {
    setValues((prev) => ({ ...prev, [id]: { ...prev[id], use: !!prev[id].template && value } }));
  };

  const rows = useMemo(() => {
    return items.map((item) => {
      const { id, name, sample_data } = item;
      const suggestion = values?.[id] || {};
      const samples = sample_data.filter((d) => d);

      const currentOptions = Object.keys(templateFields)
        .filter((key) => !selectedTemplates.includes(templateFields[key].value as string) || templateFields[key].value === suggestion.template)
        .reduce((acc, key) => {
          acc[key] = templateFields[key];
          return acc;
        }, {} as { [key: string]: InputOption });

      return {
        "Column in File": {
          raw: name || false,
          content: name || <em>- empty -</em>,
        },
        "Sample Data": {
          raw: "",
          content: (
            <div title={samples.join(", ")} className={style.samples}>
              {samples.map((d, i) => (
                <small key={i}>{d}</small>
              ))}
            </div>
          ),
        },
        "Template Fields": {
          raw: "",
          content: (
            <Input
              options={currentOptions}
              value={suggestion.template}
              placeholder="- Select one -"
              variants={["small"]}
              onChange={(template: any) => handleTemplateChange(id, template)}
            />
          ),
        },
        Include: {
          raw: false,
          content: <Switch checked={suggestion.use} onChange={(e) => handleUseChange(id, e.target.checked)} />,
        },
      };
    });
  }, [values]);

  return { rows, formValues: values };
}
