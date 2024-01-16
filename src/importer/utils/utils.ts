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

export const validateJSON = (str: string, paramName: string) => {
  if (!str || str === "undefined") {
    return "";
  }
  try {
    const obj = JSON.parse(str);
    return JSON.stringify(obj);
  } catch (e) {
    console.error(`The parameter '${paramName}' could not be parsed as JSON. Please check the documentation for more details.`, e);
    return "";
  }
};

export const sanitizeKey = (input: string): string => {
  let result = input.toLowerCase().replace(/\s/g, "_"); // Replace spaces with underscores
  result = result.replace(/[^a-zA-Z0-9_]/g, ""); // Remove non-alphanumeric characters except underscore
  return result;
};

export const parseOptionalBoolean = (val?: boolean) => {
  return typeof val === "undefined" || val === null ? "" : val ? "true" : "false";
};

export const strToBoolean = (str: string) => !!str && (str.toLowerCase() === "true" || str === "1");

export const strToOptionalBoolean = (str: string) => (str ? str.toLowerCase() === "true" || str === "1" : undefined);

export const strToDefaultBoolean = (str: string, defaultValue: boolean) => (str ? str.toLowerCase() === "true" || str === "1" : defaultValue);

// Check if a hex color is valid
export const isValidColor = (color: string) => /^#([0-9A-F]{3}){1,2}$/i.test(color);

// Expand a three-character hex to six characters
export const expandHex = (color: string) => {
  if (color.length === 4) {
    // #rgb => #rrggbb
    color = "#" + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
  }
  return color;
};

// Darken a hex color by a certain percent
export const darkenColor = (color: string, percent: number) => {
  if (!isValidColor(color)) return color;

  color = expandHex(color); // Ensure the color is in 6-character format

  const num = parseInt(color.replace("#", ""), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) - amt,
    B = ((num >> 8) & 0x00ff) - amt,
    G = (num & 0x0000ff) - amt;

  return (
    "#" +
    (0x1000000 + (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 + (B < 255 ? (B < 1 ? 0 : B) : 255) * 0x100 + (G < 255 ? (G < 1 ? 0 : G) : 255))
      .toString(16)
      .slice(1)
  );
};
