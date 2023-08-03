import { useMemo, useState } from "react";
import { Input, Switch } from "@tableflow/ui-library";
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

  const templateFields = useMemo(
    () =>
      templateColumns.reduce((acc, field) => {
        return { ...acc, [field.name]: { value: field.id, required: field.required } };
      }, {}),
    [JSON.stringify(templateColumns)]
  );

  const handleTemplateChange = (id: string, template: string) => {
    setValues((prev) => ({ ...prev, [id]: { ...prev[id], template, use: !!template } }));
  };

  const handleUseChange = (id: string, value: boolean) => {
    setValues((prev) => ({ ...prev, [id]: { ...prev[id], use: !!prev[id].template && value } }));
  };

  const rows = useMemo(() => {
    return items.map((item) => {
      const { id, name, sample_data } = item;
      const suggestion = values?.[id] || "";
      const samples = sample_data.filter((d) => d);

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
              options={templateFields}
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
