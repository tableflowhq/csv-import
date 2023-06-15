import { useMemo } from "react";
import { Icon } from "@tableflowhq/ui-library";
import { TemplateColumn } from "../../../api/types";

export default function useTemplateTable(fields: TemplateColumn[] = []) {
  const result = useMemo(() => {
    return fields.map((item) => ({
      Name: item.name,
      Required: { raw: item?.required ? 1 : 0, content: item?.required ? <Icon icon="check" /> : <></> },
    }));
  }, [fields]);

  return result;
}
