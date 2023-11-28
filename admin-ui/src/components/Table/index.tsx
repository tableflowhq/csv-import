import React, { createContext, useContext } from "react";
import { DragDropContext, Draggable } from "react-beautiful-dnd";
import useRect from "../../hooks/useRect";
import classes from "../../utils/classes";
import { StrictModeDroppable } from "./types/droppable";
import { CellProps, RowProps, TableProps } from "./types";
import themeDefault from "./style/Default.module.scss";
import Tooltip from "../Tooltip";

const TableContext = createContext<any>({});

export default function Table({
  data, // An array of objects with the data to be displayed
  keyAsId = "id", // Has to be a unique property in the data array to be used as key
  theme, // A CSS module object to style the table
  mergeThemes, // Should 'theme' be the only style applied (false) or be merged with the default style (true)
  highlightColumns, // Columns that should use the highlighted style
  hideColumns = ["id"], // Array of columns to be hidden in the display
  emptyState,
  heading,
  background = "zebra",
  columnWidths = [],
  columnAlignments = [],
  fixHeader = false,
  onRowClick,
  reorderable,
  onRowsReorder,
}: TableProps): React.ReactElement {
  // THEME
  // Tables receive a full CSS module as theme or applies default styles
  // depending on mergeThemes being true it will merge both themes or use only the custom one
  // use a copy of ./style/Default.module.scss as base to make a custom theme
  // another example of the theme lives in src/features/contents/versions/style/TableTheme.module.scss

  const style = !theme ? themeDefault : mergeThemes ? { ...themeDefault, ...theme } : theme;

  // TABLE HEADINGS
  // Hide column title if the item has an action (action button) or the title starts with underscore
  const modelDatum = data?.[0];
  const thead: any = modelDatum
    ? // Add extra column for the drag handle
      (reorderable ? ["", ...Object.keys(modelDatum)] : Object.keys(modelDatum)).map((k) => {
        const value = modelDatum[k];
        if (k.indexOf("_") === 0) {
          return "";
        }
        if (typeof value === "object" && value?.captionInfo) {
          return { key: k, captionInfo: value.captionInfo };
        }
        return k;
      })
    : {};

  const [setRef, tableSize] = useRect();

  const context = {
    style,
    highlightColumns,
    hideColumns,
    columnWidths,
    columnAlignments,
    tableSize,
  };

  if (!data || !data?.length) return <div className={style.emptyMsg}>{emptyState || null}</div>;

  const tableStyle = classes([style?.table, style?.[background], fixHeader && style?.fixHeader]);

  const headingContent = heading ? (
    <div className={style.caption}>{heading}</div>
  ) : (
    <div className={style.thead} role="rowgroup">
      <HeadingRow datum={thead} isHeading={true} index={0} keyAsId={keyAsId} />
    </div>
  );

  const onDragEnd = (result: any) => {
    if (!reorderable) return;
    if (typeof onRowsReorder === "undefined") return;
    if (!result.destination) return;

    onRowsReorder(result);
  };

  return (
    <TableContext.Provider value={context}>
      <div className={tableStyle} role="table">
        {headingContent}

        <DragDropContext onDragEnd={onDragEnd}>
          <StrictModeDroppable droppableId="droppable">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className={style.tbody} role="rowgroup">
                {data.map((d, i) => {
                  const index = d.index ? Number(d.index) : i;
                  const key = keyAsId && d?.[keyAsId] ? d[keyAsId] : index;
                  const props = { datum: d, onClick: onRowClick, index: index, keyAsId };
                  return <Row {...props} key={key?.toString()} reorderable={reorderable} />;
                })}
                {provided.placeholder}
              </div>
            )}
          </StrictModeDroppable>
        </DragDropContext>
      </div>
    </TableContext.Provider>
  );
}

const HeadingRow = ({ datum, onClick }: RowProps) => {
  const context = useContext(TableContext);
  const className = classes([context.style?.tr]);

  return (
    <div className={className} role="row" onClick={() => onClick?.(datum)}>
      {renderCells(datum, context, true)}
    </div>
  );
};

const Row = ({ datum, onClick, index, keyAsId, reorderable }: RowProps) => {
  const context = useContext(TableContext);
  const className = classes([context.style?.tr]);

  if (reorderable) {
    return (
      <Draggable draggableId={datum[keyAsId]?.toString() ?? `${index}`} index={index}>
        {(provided) => {
          // Append the grab handle to the datum
          const modifiedDatum = {
            grabHandle: (
              <div {...provided.dragHandleProps} style={{ cursor: "grab" }}>
                ☰
              </div>
            ),
            ...datum,
          };
          return (
            <div {...provided.draggableProps} ref={provided.innerRef} className={className} role="row" onClick={() => onClick?.(datum)}>
              {renderCells(modifiedDatum, context)}
            </div>
          );
        }}
      </Draggable>
    );
  }
  return (
    <div className={className} role="row" onClick={() => onClick?.(datum)}>
      {renderCells(datum, context)}
    </div>
  );
};

const renderCells = (datum: any, { highlightColumns, hideColumns, columnWidths, columnAlignments, tableSize, style }: any, isHeading = false) => {
  return Object.keys(datum)
    .filter((k) => !hideColumns.includes(datum[k]) && !hideColumns.includes(k))
    .map((k, i) => {
      let content = (datum[k] as any)?.content || datum[k];
      const tooltip = (datum[k] as any)?.tooltip;
      const captionInfo = isHeading ? (datum[k] as any)?.captionInfo : null;
      const headingKey = isHeading ? (datum[k] as any)?.key : null;
      content = isHeading && captionInfo ? <Tooltip title={captionInfo}>{headingKey}</Tooltip> : content;
      const wrappedContent = content && typeof content === "string" ? <span>{content}</span> : content;

      const cellClass = classes([
        highlightColumns?.includes(k) && style.highlight,
        !wrappedContent && style.empty,
        typeof content !== "string" && style.element,
      ]);

      const width = columnWidthBound(tableSize?.width, columnWidths?.[i]);
      const cellStyle = { width, textAlign: columnAlignments?.[i] || "left" };

      if (k === "grabHandle") {
        // Special handling for the grab handle cell, if needed in the future
        return (
          <Cell key={k} cellClass={cellClass} cellStyle={cellStyle} tooltip={tooltip || ""}>
            {wrappedContent}
          </Cell>
        );
      }
      return (
        <Cell key={k} cellClass={cellClass} cellStyle={cellStyle} tooltip={tooltip || ""}>
          {wrappedContent}
        </Cell>
      );
    });
};

const Cell = ({ children, cellClass, cellStyle, tooltip }: CellProps) => {
  const { style } = useContext(TableContext);
  const cellProps = {
    className: classes([style?.td, cellClass, !children && style?.empty]),
    role: "cell",
    style: cellStyle,
    ...(tooltip ? { title: tooltip } : {}),
  };
  return <div {...cellProps}>{children}</div>;
};

const columnWidthBound = (tableWidth: number, widthValue: string, minPixels = 60) => {
  if (!widthValue) return "auto";
  if (!widthValue.endsWith("%") || !tableWidth) return widthValue;
  const width = Number(widthValue.match(/\d+/)?.join("") || 0);
  const min = (minPixels / tableWidth) * 100;
  return Math.max(width, min) + "%";
};
