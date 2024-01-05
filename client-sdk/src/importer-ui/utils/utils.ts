// Allows for the user to pass in JSON as either an object or a string
export const parseObjectOrStringJSON = (name: string, param?: Record<string, unknown> | string): string => {
  if (typeof param === "undefined") {
    return "";
  }

  let parsedObj: Record<string, unknown> = {};

  if (typeof param === "string") {
    try {
      parsedObj = JSON.parse(param);
    } catch (e) {
      console.error(
        `The '${name}' prop is not a valid JSON string. This prop can either be a JSON string or JSON object. Please check the documentation for more details.`
      );
      return "";
    }
  } else {
    parsedObj = param;
  }

  // Replace % symbols with %25
  for (const key in parsedObj) {
    if (typeof parsedObj[key] === "string") {
      parsedObj[key] = (parsedObj[key] as string).replace(/%(?!25)/g, "%25");
    }
  }

  return JSON.stringify(parsedObj);
};

export const parseObjectOrStringJSONToRecord = (name: string, param?: Record<string, unknown> | string): Record<string, unknown> => {
  if (typeof param === "undefined") {
    return {};
  }

  let parsedObj: Record<string, unknown> = {};

  if (typeof param === "string") {
    try {
      parsedObj = JSON.parse(param);
    } catch (e) {
      console.error(
        `The '${name}' prop is not a valid JSON string. This prop can either be a JSON string or JSON object. Please check the documentation for more details.`
      );
      return {};
    }
  } else {
    parsedObj = param;
  }

  return parsedObj;
};

export const parseOptionalBoolean = (val?: boolean) => {
  return typeof val === "undefined" || val === null ? "" : val ? "true" : "false";
};

export const sanitizeKey = (input: string): string => {
  let result = input.toLowerCase().replace(/\s/g, "_"); // Replace spaces with underscores
  result = result.replace(/[^a-zA-Z0-9_]/g, ""); // Remove non-alphanumeric characters except underscore
  return result;
};
