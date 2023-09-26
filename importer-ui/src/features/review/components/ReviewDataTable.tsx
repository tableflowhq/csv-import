/* eslint-disable */
import { ColDef, GetRowIdFunc, GetRowIdParams, GridReadyEvent, ICellRendererParams, IDatasource, ISizeColumnsToFitParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { classes, Icon, Tooltip } from "@tableflow/ui-library";
import { IconType } from "@tableflow/ui-library/build/Icon/types";
import useGetRows, { fetchRows } from "../../../api/useGetRows";
import useDelayedLoader from "../../../hooks/useDelayLoader";
import { TableProps } from "../types";
import style from "../style/Review.module.scss";
import "./TableStyle.scss";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

function ReviewDataTable({ cellClickedListener, theme, uploadId, filter, template }: TableProps) {
  const customSelectClass = "ag-theme-alpine-dark-custom-select";
  const gridRef: any = useRef(null);
  const gridOptions = useRef(null);
  const paginatedDataRef: any = useRef();
  const filterRef: any = useRef(filter);

  const [columnDefs, setColumnDefs] = useState<any>([]);
  const [selectedClass, setSelectedClass] = useState(customSelectClass);

  const [paginatedData, setPaginatedData] = useState<any>();

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

  const setDataSource = () => {
    const dataSource: IDatasource = {
      rowCount: paginatedData?.pagination?.total || undefined,
      getRows: async (params: any) => {
        const previousData = paginatedDataRef.current || {};
        const nextOffset = previousData?.pagination?.next_offset || 0;

        // gets the paginated data
        const newData = await fetchRows(uploadId, filterRef.current, 100, nextOffset);

        const paginationInfo = newData?.pagination;
        const rowThisPage = newData?.rows || [];

        let lastRow = -1;
        if (paginationInfo?.total !== undefined && paginationInfo.total <= params.endRow) {
          lastRow = paginationInfo.total;
        }
        params.successCallback(rowThisPage, lastRow);
        setPaginatedData({ ...newData });
      },
    };
    gridRef.current.setDatasource(dataSource);
    setColumnSizes();
  };

  const onGridReady = useCallback((params: GridReadyEvent<any>) => {
    gridRef.current = params.api as any;
    gridOptions.current = params as any;
    setTimeout(() => {
      setColumnSizes();
    }, 100);
    setDataSource();
  }, []);
  window.addEventListener("resize", () => {
    setColumnSizes();
  });

  const setColumnSizes = () => {
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
        valueGetter: "node.id",
        field: "index",
        width: 70,
        pinned: headers.length >= 5 ? "left" : undefined,
      });
      setColumnDefs(generatedColumnDefs.reverse());
    }
  }, [JSON.stringify(paginatedData?.rows), JSON.stringify(template)]);

  // Index column plus one
  const getRowId = useMemo<any>(() => {
    return (params: GetRowIdParams) => params.data.index + 1;
  }, []);

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
        onCellValueChanged={cellClickedListener}
        onCellClicked={onCellClicked}
        onCellMouseDown={onCellMouseDown}
        onGridReady={onGridReady}
        cacheBlockSize={100}
        rowModelType={"infinite"}
        cacheOverflowSize={2}
        maxConcurrentDatasourceRequests={1}
        maxBlocksInCache={10}
        tooltipShowDelay={500}
        getRowId={getRowId}
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
