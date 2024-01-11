import { Template, TemplateColumn } from "../types";
import { parseObjectOrStringJSONToRecord, sanitizeKey } from "./utils";

export function convertRawTemplate(rawTemplate?: Record<string, unknown> | string): [Template | null, string | null] {
  const template = parseObjectOrStringJSONToRecord("template", rawTemplate);

  if (!template || Object.keys(template).length === 0) {
    return [null, "The parameter 'template' is required. Please check the documentation for more details."];
  }

  const columnData = template["columns"];
  if (!columnData) {
    return [null, "Invalid template: No columns provided"];
  }
  if (!Array.isArray(columnData)) {
    return [null, "Invalid template: columns should be an array of objects"];
  }

  const seenKeys: Record<string, boolean> = {};
  const seenSuggestedMappings: Record<string, boolean> = {};
  const columns: TemplateColumn[] = [];

  for (let i = 0; i < columnData.length; i++) {
    const item = columnData[i];

    if (typeof item !== "object") {
      return [null, `Invalid template: Each item in columns should be an object (check column ${i})`];
    }

    const name: string = item.name || "";
    let key: string = item.key || "";
    const description: string = item.description || "";
    const required: boolean = item.required || false;
    let suggestedMappings: string[] = item.suggested_mappings || [];

    if (name === "") {
      return [null, `Invalid template: The parameter "name" is required for each column (check column ${i})`];
    }
    if (key === "") {
      key = sanitizeKey(name);
    }
    if (seenKeys[key]) {
      return [null, `Invalid template: Duplicate keys are not allowed (check column ${i})`];
    }

    seenKeys[key] = true;

    for (let j = 0; j < suggestedMappings.length; j++) {
      let mappingVal = suggestedMappings[j].trim();
      const lowerCaseMapping = mappingVal.toLowerCase();

      if (mappingVal === "" || seenSuggestedMappings[lowerCaseMapping]) {
        return [null, `Invalid template: The suggested_mappings for column ${name} cannot contain blank values or duplicate values.`];
      }

      seenSuggestedMappings[lowerCaseMapping] = true;
      suggestedMappings[j] = mappingVal;
    }

    columns.push({
      name,
      key,
      description,
      required,
      suggested_mappings: suggestedMappings,
    } as TemplateColumn);
  }

  if (columns.length === 0) {
    return [null, "Invalid template: No columns were provided"];
  }

  return [{ columns }, null];
}
