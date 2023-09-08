function parseCssOverrides(cssOverrides?: string) {
  let cssAsObject = {};

  if (!providedCssOverrides(cssOverrides)) {
    return "";
  }
  try {
    cssAsObject = JSON.parse(cssOverrides || "");
  } catch (e) {
    console.error('The "cssOverrides" prop is not a valid JSON string. Please check the documentation for more details.');
  }

  const parsedCss = Object.entries(cssAsObject)
    .map(([k, v]) => `${parseCssSelectors(k)}{ ${v} }`)
    .join("\n");

  return parsedCss;
}

function parseCssSelectors(cssSelector: string) {
  const parsedCssSelector = cssSelector
    .split(",")
    .map((selector) => `#root ${parseCssSelector(selector.trim())}`)
    .join(", ");

  return parsedCssSelector;
}

// parseCssSelector(".foo:[data='bar'] > span") => unchanged
// parseCssSelector("Css-module_component:before") => "#root [class^="Css-module_component_"]:before"
function parseCssSelector(selector: string) {
  return selector
    .split(":")
    .map((seudoPart) =>
      seudoPart
        .split(" ")
        .map((part) => {
          if (part.length > 3 && !/^[^A-Z]/.test(part)) return `[class^="${part}_"]`;
          return part;
        })
        .join(" ")
    )
    .join(":");
}

export function providedCssOverrides(cssOverrides?: string) {
  return !!cssOverrides && cssOverrides !== "{}";
}

export default parseCssOverrides;
