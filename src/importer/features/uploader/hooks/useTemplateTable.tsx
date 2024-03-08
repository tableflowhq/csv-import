import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Tooltip from "../../../components/Tooltip";
import { TemplateColumn } from "../../../types";
import { PiCheckBold } from "react-icons/pi";

export default function useTemplateTable(fields: TemplateColumn[] = []) {
  if (!fields) {
    return [];
  }
  const { t } = useTranslation();
  const expectedColumnKey = t("Expected Column");
  const requiredKey = t("Required");
  const result = useMemo(() => {
    return fields.map((item) => ({
      [expectedColumnKey]: item?.description
        ? {
            raw: item.name,
            content: (
              <div>
                <Tooltip title={item?.description}>{item.name}</Tooltip>
              </div>
            ),
          }
        : item.name,
      [requiredKey]: { raw: item?.required ? 1 : 0, content: item?.required ? <PiCheckBold /> : <></> },
    }));
  }, [fields]);

  return result;
}
