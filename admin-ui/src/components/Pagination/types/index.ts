export type PaginationProps = {
  totalItems: number;
  itemsPerPage: number;
  initialPage?: number;
  paginatorSize?: number;
  onPageChange?: (selectedPage: number) => void;
  showNumbers?: boolean;
  showArrows?: boolean;
  showFirstLast?: boolean;
};

export type PaginatorType = {
  hide?: boolean;
  hideArrows?: boolean;
  pages: number[];
  nextPage: number | null;
  prevPage: number | null;
  totalPages: number;
  currentPage: number;
  firstPage: number | null;
  lastPage: number | null;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
};
