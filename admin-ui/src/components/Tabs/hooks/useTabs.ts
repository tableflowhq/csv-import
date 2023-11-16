import { useState } from "react";

export default function useTabs(tabs: any, initialValue = "") {
  const [tab, setTab] = useState(initialValue || tabs?.[Object.keys(tabs)?.[0]]);

  return { tabs, tab, setTab };
}
