/* eslint-disable */
import {
  CellValueChangedEvent,
  ColDef,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  IDatasource,
  ISizeColumnsToFitParams,
  ValueGetterParams,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { classes, Icon, Tooltip } from "@tableflow/ui-library";
import { IconType } from "@tableflow/ui-library/build/Icon/types";
import { post } from "../../../api/api";
import { fetchRows } from "../../../api/useGetRows";
import { TableProps } from "../types";
import style from "../style/Review.module.scss";
import "./TableStyle.scss";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

function ReviewDataTable({ theme, uploadId, filter, template }: TableProps) {
  const customSelectClass = "ag-theme-alpine-dark-custom-select";
  const paginatedDataRef: any = useRef();
  const filterRef: any = useRef(filter);

  const [columnDefs, setColumnDefs] = useState<any>([]);

  const [paginatedData, setPaginatedData] = useState<any>();
  const gridRef = useRef<GridApi | null>(null);
  const [selectedClass, setSelectedClass] = useState(customSelectClass);
  const cellValueChangeSet = useRef(new Set<string>());

  // const {
  //   mutate: mutateCell,
  //   error: editCellError,
  //   isSuccess: cellEditIsSuccess,
  //   isLoading: cellEditIsLoading,
  //   data: cellEditData,
  // } = useEditCell(uploadId || "");

  const onCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    const columnId = event.column.getColId();
    const cellId = `${event.rowIndex}-${columnId}`;
    // Check if the change was done programmatically to not cause an infinite loop when reverting changes to cell edits
    if (cellValueChangeSet.current.has(cellId)) {
      cellValueChangeSet.current.delete(cellId);
      return;
    }
    let cellKey = "";
    const parts = columnId.split(".");
    if (parts.length > 1 && parts[0] === "values") {
      cellKey = parts[1];
    } else {
      console.error("Unexpected column ID format", columnId);
      return;
    }
    const endpoint = `import/${uploadId}/cell/edit`;
    const body = {
      row_index: event.rowIndex,
      is_error: event.data?.errors ? Object.keys(event.data.errors).length > 0 : false,
      cell_key: cellKey,
      cell_value: event.newValue,
    };
    post(endpoint, body).then((res) => {
      if (!res.ok) {
        cellValueChangeSet.current.add(cellId);
        const rowNode = gridRef.current?.getRowNode(String(event.rowIndex));
        if (rowNode) {
          rowNode.setDataValue(columnId, event.oldValue);
        }
        alert(res.error);
      } else {
        // TODO:
        // 1. Clear the error highlighting on the cell
        // 2. Update the "All" "Valid" "Error" selector with the updated count (returned from this response) ...we might have to move this to the review/index component to do this
        // 3. Update the other grids with the new value
      }
    });
  }, []);

  useEffect(() => {
    paginatedDataRef.current = paginatedData;
  }, [paginatedData]);

  useEffect(() => {
    filterRef.current = filter;
    setPaginatedData(null);
    paginatedDataRef.current = null;
    gridRef.current && setDataSource();
  }, [filter]);

  // useEffect(() => {
  //   if (gridRef.current) {
  //     // isLoading && gridRef.current.showLoadingOverlay();
  //     // !isLoading && gridRef.current.hideOverlay();
  //     setColumnSizes();
  //   }
  // }, [isLoading]);

  const addEmptyRows = (newData: any) => {
    let dataPage = newData;

    if (!!Object.keys(newData).length && newData.rows.length < 9) {
      const missingRows = 9 - newData.rows.length;
      const rows = [...newData.rows];

      for (let i = 0; i < missingRows; i++) {
        rows.push({});
      }

      dataPage = {
        ...newData,
        pagination: {
          ...newData.pagination,
          total: 9,
        },
        rows,
      };
    }

    return dataPage;
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
    setColumnSizes();
  };

  const onGridReady = useCallback((params: GridReadyEvent<any>) => {
    gridRef.current = params.api as any;
    setTimeout(() => {
      setColumnSizes();
    }, 100);
    setDataSource();
  }, []);
  window.addEventListener("resize", () => {
    setColumnSizes();
  });

  const setColumnSizes = () => {
    // @ts-ignore
    if (!gridRef.current || gridRef.current?.destroyCalled) return;
    const columnCount = gridRef.current?.getColumnDefs?.()?.length || 0;
    // onl resize if there are less than 5 columns
    if (columnCount < 5) {
      // re-size all columns but index
      const options: ISizeColumnsToFitParams = {
        columnLimits: [
          {
            key: "index",
            maxWidth: 70,
            minWidth: 70,
          },
        ],
      };
      gridRef.current && gridRef.current?.sizeColumnsToFit(options);
    }
  };

  // TODO: tooltip is showing cut off
  // const customHeaderComponent = (params: any) => {
  //   return (
  //     <div className={style.headerCell}>
  //       {params.displayName} {params.displayDescription && <Tooltip title={params.displayDescription}></Tooltip>}
  //     </div>
  //   );
  // };

  useEffect(() => {
    if (paginatedData?.rows?.[0]?.values) {
      const headers = Object.keys(paginatedData.rows[0]?.values);
      const generatedColumnDefs = headers.map((header: string) => {
        const displayName = template?.columns.find((c) => c.key === header)?.name;
        const displayDescription = template?.columns.find((c) => c.key === header)?.description;

        return {
          headerName: displayName || header,
          // headerComponent: customHeaderComponent,
          headerComponentParams: {
            displayDescription: displayDescription,
          },
          editable: true,
          field: `values.${header}`,
          cellStyle: (params: any) => {
            if (params.data?.errors?.[header]) {
              return { backgroundColor: getCellBackgroundColor(params.data.errors[header][0].severity) };
            }
            return null;
          },
          cellRenderer: (params: ICellRendererParams) => cellRenderer(params, header),
          tooltipValueGetter: tooltipValueGetterImproved,
          sortable: false,
          filter: false,
          suppressMovable: true,
          tooltipComponent: CustomTooltip,
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
        width: 70,
        pinned: headers.length >= 5 ? "left" : undefined,
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

function CustomTooltip(props: any) {
  const { data } = props;
  const { errors } = data;
  const { headerName } = props.colDef;
  const error = errors?.[headerName];
  if (!error) return null;
  return (
    <Tooltip className={style.tableflowTooltip} icon={getIconType(error[0].severity)}>
      {
        <div className={style.tooltipContent}>
          {error?.map((err: any, index: number) => (
            <span key={index}>{err?.message}</span>
          ))}
        </div>
      }
    </Tooltip>
  );
}

const tooltipValueGetterImproved = (params: any, header: string) => {
  if (params.data?.errors?.[header]) {
    return params.data.errors[header].map((err: any) => `• ${err.type.toUpperCase()}: ${err.message}`).join("");
  }
  return "Validation failed for this field."; // Fallback tooltip
};

type IconKeyType = "error" | "warning" | "info";

const iconTypeMap: Record<IconKeyType, IconType> = {
  error: "error",
  warning: "help",
  info: "info",
};

const getIconType = (type: string): IconType => {
  return iconTypeMap[type as IconKeyType] || "info";
};

const getCellBackgroundColor = (severity: IconKeyType): string | null => {
  const colorMap = {
    error: "#f04339",
    warning: "#ffcc00",
    info: "#4caf50",
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
          <button className={style.iconButton}>
            <Icon icon={getIconType(errors[0].type)} />
          </button>
        )}
      </span>
    );

    return cellContent;
  }
};

export default ReviewDataTable;
