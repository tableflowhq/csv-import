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
    // onl resize if there are less than 7 columns
    if (columnCount < 7) {
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
              return { backgroundColor: getCellBackgroundColor(params.data.errors[header][0].severity, theme) };
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
        valueGetter: (params: ValueGetterParams) => Number(params.node?.id ?? 0) + 1,
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
  const { field } = props.colDef;
  const parts = field?.split(".");
  const lastPart = parts[parts?.length - 1];
  const error = errors?.[lastPart!];

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
