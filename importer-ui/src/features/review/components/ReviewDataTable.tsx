/* eslint-disable */
import { ColDef, GridApi, GridReadyEvent, ICellRendererParams, IDatasource, ISizeColumnsToFitParams, ValueGetterParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { classes, Icon, Tooltip } from "@tableflow/ui-library";
import { IconType } from "@tableflow/ui-library/build/Icon/types";
import { fetchRows } from "../../../api/useGetRows";
import { TableProps } from "../types";
import style from "../style/Review.module.scss";
import "./TableStyle.scss";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

const TABLE_WIDTH = 1000;
const INDEX_ROW_WIDTH = 70;
const MAX_COLUMN_SCROLL = 7;
const MAX_ROWS = 9;

function ReviewDataTable({ theme, uploadId, filter, template, onCellValueChanged }: TableProps) {
  const customSelectClass = "ag-theme-alpine-dark-custom-select";
  const paginatedDataRef: any = useRef();
  const filterRef: any = useRef(filter);

  const [columnDefs, setColumnDefs] = useState<any>([]);

  const [paginatedData, setPaginatedData] = useState<any>();
  const gridRef = useRef<GridApi | null>(null);
  const [selectedClass, setSelectedClass] = useState(customSelectClass);

  useEffect(() => {
    paginatedDataRef.current = paginatedData;
  }, [paginatedData]);

  useEffect(() => {
    filterRef.current = filter;
    setPaginatedData(null);
    paginatedDataRef.current = null;
    gridRef.current && setDataSource();
  }, [filter]);

  const addEmptyRows = (newData: any) => {
    if (!!Object.keys(newData).length && newData.rows.length < MAX_ROWS) {
      const missingRows = MAX_ROWS - newData.rows.length;
      const rows = [...newData.rows, ...Array(missingRows).fill({})];

      return {
        ...newData,
        pagination: {
          ...newData.pagination,
          total: MAX_ROWS,
        },
        rows,
      };
    }
  };

  const setDataSource = () => {
    const dataSource: IDatasource = {
      rowCount: paginatedData?.pagination?.total || undefined,
      getRows: async (params: any) => {
        const previousData = paginatedDataRef.current || {};
        const nextOffset = previousData?.pagination?.next_offset || 0;

        // gets the paginated data
        const newData = await fetchRows(uploadId, filterRef.current, 100, nextOffset);

        const tableData = addEmptyRows(newData);
        const paginationInfo = tableData?.pagination;
        const rowThisPage = tableData?.rows || [];

        let lastRow = -1;
        if (paginationInfo?.total !== undefined && paginationInfo.total <= params.endRow) {
          lastRow = paginationInfo.total;
        }
        params.successCallback(rowThisPage, lastRow);
        setPaginatedData({ ...tableData });
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
    if (paginatedData?.rows?.[0]?.values) {
      const headers = Object.keys(paginatedData.rows[0]?.values);
      const generatedColumnDefs = headers.map((header: string) => {
        const displayName = template?.columns.find((c) => c.key === header)?.name;
        const displayDescription = template?.columns.find((c) => c.key === header)?.description;

        return {
          headerName: displayName || header,
          headerComponent: customHeaderComponent,
          headerComponentParams: {
            displayDescription: displayDescription,
          },
          editable: true,
          field: `values.${header}`,
          cellStyle: (params: any) => {
            if (params.data?.errors?.[header]) {
              return { backgroundColor: getCellBackgroundColor(params.data.errors[header][0].severity, theme) };
            }
            return null;
          },
          cellRenderer: (params: ICellRendererParams) => cellRenderer(params, header),
          sortable: false,
          filter: false,
          suppressMovable: true,
          width: headers.length < MAX_COLUMN_SCROLL ? (TABLE_WIDTH - INDEX_ROW_WIDTH) / headers.length : undefined,
        } as ColDef;
      });
      // Add index column to the beginning of the columns
      generatedColumnDefs.push({
        headerName: "",
        // Set the index cell value to the node ID + 1
        valueGetter: (params: ValueGetterParams) => {
          return params.data && params.data.values ? Number(params.node?.id ?? 0) + 1 : "";
        },
        field: "index",
        width: INDEX_ROW_WIDTH,
        pinned: headers.length > MAX_COLUMN_SCROLL ? "left" : undefined,
      });
      setColumnDefs(generatedColumnDefs.reverse());
    }
  }, [JSON.stringify(paginatedData?.rows), JSON.stringify(template)]);

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

  return (
    <div
      className={classes([theme === "dark" ? "ag-theme-alpine-dark" : "ag-theme-alpine", selectedClass])}
      style={{
        height: 450,
      }}>
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

const iconTypeMap: Record<IconKeyType, IconType> = {
  error: "error",
  warning: "help",
  info: "info",
};

const getIconType = (type: string): IconType => {
  return iconTypeMap[type as IconKeyType] || "info";
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

const cellRenderer = (params: any, header: string) => {
  if (params.data) {
    const errors = params.data?.errors?.[header];

    const cellContent = (
      <span
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
        }}>
        <span>{params.value}</span>
        {errors && (
          <button>
            <Tooltip className={style.iconButton} title={errors[0].message} icon={getIconType(errors[0].type)} />
          </button>
        )}
      </span>
    );

    return cellContent;
  }
};

export default ReviewDataTable;
