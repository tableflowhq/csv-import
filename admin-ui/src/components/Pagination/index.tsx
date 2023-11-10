import classes from "../../utils/classes";
import usePagination from "./hooks/usePagination";
import { PaginationProps } from "./types";
import style from "./style/Pagination.module.scss";
import { PiArrowLeftBold, PiArrowRightBold } from "react-icons/pi";

export default function Pagination({
  totalItems,
  itemsPerPage,
  initialPage = 1,
  paginatorSize = 7,
  onPageChange,
  showNumbers = true,
  showArrows = true,
  showFirstLast = true,
}: PaginationProps): React.ReactElement {
  const { hide, hideArrows, pages, currentPage, setCurrentPage, prevPage, nextPage, firstPage, lastPage } = usePagination(
    totalItems,
    itemsPerPage,
    initialPage || 1,
    paginatorSize || 7
  );

  const handleClick = (page: number) => {
    setCurrentPage && setCurrentPage(page);
    onPageChange && onPageChange(page);
  };

  const renderPageNumbers = pages.map((number: number) => {
    const className = classes([currentPage === number && style.selected]);

    return (
      <button key={number} onClick={() => handleClick(number)} disabled={currentPage === number} className={className}>
        {number}
      </button>
    );
  });

  const arrowClass = classes([style.arrow]);

  return (
    <div className={!hide ? style.paginator : ""}>
      {!hide && (
        <>
          {!hideArrows && showFirstLast && (
            <button onClick={() => handleClick(firstPage || 0)} disabled={firstPage === null} className={arrowClass}>
              {firstPage !== null && `${firstPage}...`}
            </button>
          )}

          {showArrows && (
            <button onClick={() => handleClick(prevPage || 0)} disabled={prevPage === null} className={arrowClass}>
              <PiArrowLeftBold />
            </button>
          )}

          {showNumbers && renderPageNumbers}

          {showArrows && (
            <button onClick={() => handleClick(nextPage || 0)} disabled={nextPage === null} className={arrowClass}>
              <PiArrowRightBold />
            </button>
          )}

          {!hideArrows && showFirstLast && (
            <button onClick={() => handleClick(lastPage || 0)} disabled={lastPage === null} className={arrowClass}>
              {lastPage !== null && `...${lastPage}`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
