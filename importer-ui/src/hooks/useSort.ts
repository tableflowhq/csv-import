import { useMemo, useState } from "react";
import { DataType } from "../api/types";

export default function useSort(data: DataType, initialSortKey = "", initialSortAsc = true) {
  const [sortKey, setSortKey] = useState(initialSortKey);
  const [sortAsc, setSortAsc] = useState(initialSortAsc);

  const dataSorted = useMemo(() => {
    const sortedData = sortData(data, sortKey);
    return sortAsc ? sortedData.reverse() : sortedData;
  }, [JSON.stringify(data), sortKey, sortAsc]);

  const setSort = (sortKey: string, sortAsc: boolean) => {
    setSortKey(sortKey);
    setSortAsc(sortAsc);
  };

  return { dataSorted, setSort, sortKey, sortAsc };
}

const sortData = (data: DataType, sortBy: string): DataType => {
  return !sortBy
    ? data
    : data.sort((a, b) => {
        const c = a[sortBy] as string | number;
        const d = b[sortBy] as string | number;
        return c > d ? 1 : c < d ? -1 : 0;
      });
};
