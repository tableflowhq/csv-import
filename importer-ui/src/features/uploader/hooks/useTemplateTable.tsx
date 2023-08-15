import { useMemo } from "react";
import { Icon } from "@tableflow/ui-library";
import Tooltip from "../../../components/Tooltip";
import { TemplateColumn } from "../../../api/types";

export default function useTemplateTable(fields: TemplateColumn[] = []) {
  const result = useMemo(() => {
    return fields.map((item) => ({
      Name: item?.description
        ? {
            raw: item.name,
            content: (
              <div>
                <Tooltip title={item?.description}>{item.name}</Tooltip>
              </div>
            ),
          }
        : item.name,
      Required: { raw: item?.required ? 1 : 0, content: item?.required ? <Icon icon="check" /> : <></> },
    }));
  }, [fields]);

  return result;
}
