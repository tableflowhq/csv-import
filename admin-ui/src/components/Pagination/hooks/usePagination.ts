import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { PaginatorType } from "../types";

const usePaginator = (totalItems: number, itemsPerPage: number, initialPage: number, paginatorSize = 10): PaginatorType => {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const [paginator, setPaginator] = useState<PaginatorType>({
    hide: false,
    hideArrows: false,
    pages: [],
    nextPage: null,
    prevPage: null,
    totalPages,
    currentPage,
    firstPage: 1,
    lastPage: totalPages,
    setCurrentPage: setCurrentPage,
  });

  useEffect(() => {
    if (totalPages < 2) {
      setPaginator((paginator) => ({ ...paginator, hide: true }));
    } else {
      setPaginator(getPaginator(paginatorSize, totalPages, currentPage, setCurrentPage));
    }
  }, [totalPages, currentPage, initialPage]);

  return paginator;
};

const getPaginator = (
  paginatorSize: number,
  totalPages: number,
  currentPage: number,
  setCurrentPage: Dispatch<SetStateAction<number>>
): PaginatorType => {
  const halfPaginator = paginatorSize % 2 ? (paginatorSize - 1) / 2 : paginatorSize / 2;

  const min = currentPage > totalPages ? currentPage - paginatorSize : Math.ceil(currentPage - halfPaginator);
  const paginatorStart = min < 1 || totalPages <= paginatorSize + 1 ? 1 : min > totalPages - paginatorSize ? totalPages - paginatorSize + 1 : min;

  const max = paginatorStart + paginatorSize;

  const paginatorEnd = max >= totalPages ? totalPages + 1 : max;

  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  const pages = Array.from({ length: paginatorEnd - paginatorStart }, (a, x: number) => x + paginatorStart);

  const firstPage = !pages.includes(1) ? 1 : null;
  const lastPage = !pages.includes(totalPages) ? totalPages : null;

  return {
    hide: false,
    hideArrows: totalPages <= paginatorSize,
    pages,
    prevPage,
    nextPage,
    totalPages,
    currentPage,
    firstPage,
    lastPage,
    setCurrentPage,
  };
};

export default usePaginator;
