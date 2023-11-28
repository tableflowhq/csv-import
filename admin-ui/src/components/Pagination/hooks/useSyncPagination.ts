import { useEffect, useState } from "react";

type Primitive = string | number | boolean | null | undefined;

export type DataType = { [key: string]: Primitive | Primitive[] | { [key: string]: Primitive } }[];

export default function useSyncPagination(data: DataType, itemsPerPage: number) {
  const totalItems = data?.length || 0;

  const [page, setPageNumber] = useState(0);

  const [dataPage, setData] = useState(getDataPage(data, itemsPerPage, page));

  const paginate = (newPage?: number) => {
    setPageNumber((page) => (newPage !== undefined ? newPage : page));
  };

  useEffect(() => {
    setData(getDataPage(data, itemsPerPage, page));
  }, [JSON.stringify(data), page, totalItems]);

  useEffect(() => {
    paginate(1);
  }, [totalItems]);

  return { dataPage, page, paginate, totalItems };
}

function getDataPage(data: DataType, itemsPerPage: number, page: number) {
  const initial = (page - 1) * itemsPerPage;
  const final = initial + itemsPerPage;
  return data.slice(initial, final);
}
