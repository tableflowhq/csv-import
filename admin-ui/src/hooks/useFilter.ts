import { useMemo, useState } from "react";
import { DataType } from "../api/types";

export default function useFilter<T>(filterByColumns: string[], data: Record<string, any>[]) {
  const [filter, setFilter] = useState("");

  const dataFiltered = useMemo(() => {
    return filterData(data, filter, filterByColumns);
  }, [JSON.stringify(data), filter]);

  return { dataFiltered: dataFiltered as T, setFilter };
}

const filterData = (data: DataType, filter: string, filterByColumns: string[]): DataType =>
  data.filter((datum) => {
    return (
      !filter ||
      Object.keys(datum).filter((k) => {
        const itemText = datum[k];
        return filterByColumns.includes(k) && equalStrings(itemText?.toString() || "", filter);
      }).length
    );
  });

const equalStrings = (h: string, k: string): boolean => h.toLowerCase().indexOf(k.toLowerCase()) > -1;
