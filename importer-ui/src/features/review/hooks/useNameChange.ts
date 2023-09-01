import { useEffect, useState } from "react";

const useTransformValue = (initialValue: string) => {
  const [transformedValue, setTransformedValue] = useState("");

  useEffect(() => {
    const keyValue = initialValue
      .replace(/\s/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "")
      .toLowerCase();
    setTransformedValue(keyValue);
  }, [initialValue]);

  const transformValue = (value: string) => {
    const keyValue = value
      .replace(/\s/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "")
      .toLowerCase();
    setTransformedValue(keyValue);
  };

  return { transformedValue, transformValue };
};

export default useTransformValue;
