/* eslint-disable */
import { ColDef, GridApi, GridReadyEvent, ICellRendererParams, IDatasource, ValueGetterParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import Tooltip from "../../../components/Tooltip";
import { fetchRows } from "../../../api/useGetRows";
import classes from "../../../utils/classes";
import { TableProps } from "../types";
import style from "../style/Review.module.scss";
import "./TableStyle.scss";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { PiInfo } from "react-icons/pi";

const INDEX_ROW_WIDTH = 70;
const MAX_COLUMN_SCROLL = 7;

function ReviewDataTable({ theme, uploadId, filter, template, onCellValueChanged, columnsOrder, disabled, upload, onImportAlreadySubmitted }: TableProps) {
  const customSelectClass = "ag-theme-alpine-dark-custom-select";
  const paginatedDataRef: any = useRef();
  const filterRef: any = useRef(filter);

  const [columnDefs, setColumnDefs] = useState<any>([]);
  const [tableWidth, setTableWidth] = useState(1000);
  const [maxRows, setMaxRows] = useState(100);

  const [paginatedData, setPaginatedData] = useState<any>();
  const gridRef = useRef<GridApi | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [selectedClass, setSelectedClass] = useState(customSelectClass);
  const [columnsSelected, setColumnsSelected] = useState<string[]>([]);

  useEffect(() => {
    paginatedDataRef.current = paginatedData;
  }, [paginatedData]);

  useEffect(() => {
    filterRef.current = filter;
    setPaginatedData(null);
    paginatedDataRef.current = null;
    gridRef.current && setDataSource();
  }, [filter, maxRows]);

  const addEmptyRows = (newData: any) => {
    if (!!Object.keys(newData).length && newData.rows.length < maxRows) {
      const missingRows = maxRows - newData.rows.length;
      const rows = [...newData.rows, ...Array(missingRows).fill({})];

      return {
        ...newData,
        pagination: {
          ...newData.pagination,
          total: maxRows,
        },
        rows,
      };
    }
    return newData;
  };

  const setDataSource = () => {
    const dataSource: IDatasource = {
      rowCount: paginatedData?.pagination?.total || undefined,
      getRows: async (params: any) => {
        try {
        const previousData = paginatedDataRef.current || {};
        const nextOffset = previousData?.pagination?.next_offset || 0;

        // gets the paginated data
        const newData = await fetchRows(uploadId, filterRef.current, 100, nextOffset);
        if (!newData) {
          console.error("Error fetching data");
          return;
        }
        const firstColumnsKeys = Object.keys(newData?.rows[0]?.values || {});
        setColumnsSelected([...firstColumnsKeys]);
        const tableData = addEmptyRows(newData);
        const paginationInfo = tableData?.pagination;
        const rowThisPage = tableData?.rows || [];

        let lastRow = -1;
        if (paginationInfo?.total !== undefined && paginationInfo.total <= params.endRow) {
          lastRow = paginationInfo.total;
        }
        params.successCallback(rowThisPage, lastRow);
        setPaginatedData({ ...tableData });
      } catch (error) {
        if (error === "Import is already submitted") {
          onImportAlreadySubmitted();
        }
      }
      },
    };
    gridRef.current?.setDatasource?.(dataSource);
  };

  const onGridReady = useCallback((params: GridReadyEvent<any>) => {
    gridRef.current = params.api as any;
    setDataSource();
  }, []);

  const customHeaderComponent = (params: any) => {
    return (
      <div className={style.headerCell}>
        {params.displayName} {params.displayDescription && <Tooltip title={params.displayDescription}></Tooltip>}
      </div>
    );
  };

  useEffect(() => {
    if (!paginatedData?.rows?.[0]?.values) return;
    // Extract ids from columnOrder and preserve the order
    let orderedIds;
    if (!columnsOrder) {
      const mappedIds = columnsSelected.map((key) => {
        const matchingObject = template?.columns.find((obj) => obj.key === key);
        return matchingObject ? matchingObject.id : null;
      });
      const filteredIds = mappedIds.filter((id) => id !== null);
      const extendedArray = filteredIds.map((id) => ({
        id,
        index: upload?.upload_columns.findIndex((item) => item.suggested_template_column_id === id),
      }));
      const sortedArray = extendedArray.sort((a, b) => a.index - b.index);
      orderedIds = sortedArray.map((item) => item.id);
    } else {
      orderedIds = Object.values(columnsOrder);
    }

    // Map over orderedIds to get the corresponding columns from templateCols
    let orderedColumns = [];
    if (template?.columns.length !== 0) {
      orderedColumns = orderedIds.map((id) => template?.columns?.find((col) => col.id === id)).filter(Boolean) || [];
    } else {
      // If no columns exist, the upload is schemaless
      orderedColumns = orderedIds.map((id) => ({ name: id, key: id }));
    }

    const generatedColumnDefs = orderedColumns.map(({ name: colName, key: colKey }: any) => {
      const displayDescription = template?.columns?.find((c) => c.key === colKey)?.description;

      return {
        headerName: colName,
        headerComponent: customHeaderComponent,
        headerComponentParams: {
          displayDescription: displayDescription,
        },
        editable: (params) => !disabled && params.data && params.data.values,
        field: `values.${colKey}`,
        cellStyle: (params: any) => {
          if (params.data?.errors?.[colKey]) {
            return {
              backgroundColor: getCellBackgroundColor(params.data.errors[colKey][0].severity, theme),
            };
          }
          return { backgroundColor: "" };
        },
        cellRenderer: (params: ICellRendererParams) => cellRenderer(params, colKey, theme, tableWidth),
        sortable: false,
        filter: false,
        suppressMovable: true,
        resizable: true,
        minWidth: (tableWidth - INDEX_ROW_WIDTH) / orderedColumns.length,
      } as ColDef;
    });
    // Add index column to the beginning of the columns
    generatedColumnDefs.unshift({
      headerName: "",
      headerClass: "empty-header",
      // Set the index cell value to the node ID + 1
      valueGetter: (params: ValueGetterParams) => {
        return params.data && params.data.values ? Number(params.node?.id ?? 0) + 1 : "";
      },
      field: "index",
      width: INDEX_ROW_WIDTH,
      pinned: orderedColumns.length > MAX_COLUMN_SCROLL ? "left" : undefined,
    });
    setColumnDefs(generatedColumnDefs);
  }, [JSON.stringify(paginatedData?.rows), JSON.stringify(template), JSON.stringify(columnsOrder), disabled, tableWidth]);

  const onCellMouseDown = (params: any) => {
    if (params.colDef.field !== "index") {
      setSelectedClass(customSelectClass);
    }
  };

  const onCellClicked = (params: any) => {
    if (params.colDef.field === "index") {
      setSelectedClass("");
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setTableWidth((tableRef?.current?.offsetWidth || 1000) - 2);
      setMaxRows(Math.floor((tableRef?.current?.offsetHeight || 1000) / 41) - 2);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div ref={tableRef} className={classes(["grid-wrapper", theme === "dark" ? "ag-theme-alpine-dark" : "ag-theme-alpine", selectedClass])}>
      <AgGridReact
        columnDefs={columnDefs}
        defaultColDef={{}}
        animateRows={true}
        rowSelection="multiple"
        onCellValueChanged={onCellValueChanged}
        onCellClicked={onCellClicked}
        onCellMouseDown={onCellMouseDown}
        onGridReady={onGridReady}
        cacheBlockSize={100}
        rowModelType={"infinite"}
        cacheOverflowSize={2}
        maxConcurrentDatasourceRequests={1}
        maxBlocksInCache={10}
        tooltipShowDelay={500}
      />
    </div>
  );
}

type IconKeyType = "error" | "warning" | "info";

const iconTypeMap: Record<IconKeyType, ReactElement> = {
  error: <PiInfo />,
  warning: <PiInfo />,
  info: <PiInfo />,
};

const getIconType = (type: string): ReactElement => {
  return iconTypeMap[type as IconKeyType] || <PiInfo />;
};

const getCellBackgroundColor = (severity: IconKeyType, theme: string): string | null => {
  const colorMap =
    theme === "dark"
      ? {
          error: "#7A271A",
          warning: "#B54708",
          info: "#054F31",
        }
      : {
          error: "#FDA29B",
          warning: "#FEDF89",
          info: "#A6F4C5",
        };
  return colorMap[severity] || null;
};

const cellRenderer = (params: ICellRendererParams, header: string, theme: string, tableWidth: number) => {
  if (params.data) {
    const errors = params.data?.errors?.[header];

    if (params.column) {
      // column resize logic, to only reset if it has not been resized manually
      const actual = params.column.getActualWidth();
      const totalCols = params.columnApi.getAllGridColumns()?.length - 1;
      const width = totalCols < MAX_COLUMN_SCROLL ? (tableWidth - INDEX_ROW_WIDTH) / totalCols : -1;

      if (actual < width) {
        params.column.setActualWidth(width);
      } else {
        params.columnApi?.resetColumnState();
      }
    }
    const cellContent = (
      <div className={style.cellContent}>
        <span>{params.value}</span>
        {errors && (
          <div className={style.tooltipWrapper} style={{ backgroundColor: getCellBackgroundColor(errors[0].type, theme) || "" }}>
            <Tooltip className={style.iconButton} title={errors[0].message} icon={getIconType(errors[0].type)} />
          </div>
        )}
      </div>
    );

    return cellContent;
  }
};

export default ReviewDataTable;