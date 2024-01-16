import React, { createContext, useContext } from "react";
import classes from "../../utils/classes";
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
    ? Object.keys(modelDatum).map((k) => {
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
  const context = {
    style,
    highlightColumns,
    hideColumns,
    columnWidths,
    columnAlignments,
  };

  if (!data || !data?.length) return <div className={style.emptyMsg}>{emptyState || null}</div>;

  const tableStyle = classes([style?.table, style?.[background], fixHeader && style?.fixHeader]);

  const headingContent = heading ? (
    <div className={style.caption}>{heading}</div>
  ) : (
    <div className={style.thead} role="rowgroup">
      <Row datum={thead} isHeading={true} />
    </div>
  );

  return (
    <TableContext.Provider value={context}>
      <div className={tableStyle} role="table">
        {headingContent}
        <div className={style.tbody} role="rowgroup">
          {data.map((d, i) => {
            const key = keyAsId && d?.[keyAsId] ? d[keyAsId] : i;
            const props = { datum: d, onClick: onRowClick };
            return <Row {...props} key={key?.toString()} />;
          })}
        </div>
      </div>
      {!data.length && (
        <div className={style.emptyMsg} role="empty-query">
          <p>Empty</p>
        </div>
      )}
    </TableContext.Provider>
  );
}

const Row = ({ datum, onClick, isHeading }: RowProps) => {
  const { style, highlightColumns, hideColumns, columnWidths, columnAlignments } = useContext(TableContext);

  const className = classes([style?.tr]);
  return (
    <div className={className} role="row" onClick={() => onClick?.(datum)}>
      {Object.keys(datum)
        .filter((k) => !hideColumns.includes(datum[k]) && !hideColumns.includes(k))
        .map((k, i) => {
          // datum is the row
          // datum[k] is the content for the cell
          // If it is an object with the 'content' property, use that as content (can be JSX or a primitive)
          // Another 'raw' property with a primitive value is used to sort and search
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

          const cellStyle = { width: columnWidths?.[i] || "auto", textAlign: columnAlignments?.[i] || "left" };

          return (
            <Cell key={k} cellClass={cellClass} cellStyle={cellStyle} tooltip={tooltip || ""}>
              {wrappedContent}
            </Cell>
          );
        })}
    </div>
  );
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
