import { useEffect, useMemo, useState } from "react";
import Box from "../../components/Box";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import useSyncPagination from "../../components/Pagination/hooks/useSyncPagination";
import Table from "../../components/Table";
import TemplateColumnForm from "../forms/Template";
import TemplateColumnDelete from "../forms/Template/templateColumnDelete";
import { TemplateColumn } from "../../api/types";
import useGetTemplate from "../../api/useGetTemplate";
import usePostTemplateColumn from "../../api/usePostTemplateColumn";
import useEntitySelection from "../../hooks/useEntitySelection";
import useFilter from "../../hooks/useFilter";
import { columnsTable } from "./utils/columnsTable";
import { TemplatesProps } from "./types";
import style from "./style/Templates.module.scss";
import { PiMagnifyingGlass } from "react-icons/pi";

export default function Templates({ importer }: TemplatesProps) {
  const { template } = importer;
  const { data } = useGetTemplate(template.id);
  const [columns, setColumns] = useState(data?.template_columns || []);
  const { mutate, isLoading, error, isSuccess } = usePostTemplateColumn(template.id);

  // Update columns state when data from useGetTemplate changes
  useEffect(() => {
    if (data?.template_columns) {
      setColumns(data.template_columns);
    }
  }, [data]);

  const { entityId, action, update, modal } = useEntitySelection();

  const column = columns?.find((column) => column.id === entityId);

  const handleRowsReorder = (data: any) => {
    const templateColumnId = data?.draggableId;
    const newIndex = data?.destination?.index;

    if (newIndex === undefined || templateColumnId === undefined || !columns) {
      return;
    }

    // Create a copy of the columns array to manipulate
    const updatedColumns = [...columns];

    // Find the column that is being moved
    const movingColumn = updatedColumns.find((column) => column.id === templateColumnId);
    if (!movingColumn) {
      return; // Return if the moving column is not found
    }

    // Remove the moving column from its original position
    updatedColumns.splice(updatedColumns.indexOf(movingColumn), 1);

    // Insert the moving column in its new position
    updatedColumns.splice(newIndex, 0, movingColumn);

    // Normalize indexes so they are sequential starting from 0
    const normalizedColumns = updatedColumns.map((column, index) => {
      return { ...column, index };
    });

    // Update the state with the new columns order
    setColumns(normalizedColumns);
    mutate({ id: templateColumnId, index: newIndex });
  };

  const modalContent = useMemo(
    () =>
      !entityId ? (
        <Box variants={["wide", "space-mid"]} className={style.extraWide}>
          <TemplateColumnForm
            title="Add Column"
            buttonLabel="Save"
            onSuccess={modal.handleClose}
            column={column}
            context={{ templateId: template?.id }}
          />
        </Box>
      ) : action === "edit" ? (
        <Box variants={["wide", "space-mid"]} className={style.extraWide}>
          <TemplateColumnForm
            title="Edit Column"
            buttonLabel="Save"
            onSuccess={modal.handleClose}
            column={column}
            context={{ templateId: template?.id }}
          />
        </Box>
      ) : action === "delete" ? (
        <Box variants={["wide", "space-mid"]}>
          <TemplateColumnDelete column={column} onSuccess={modal.handleClose} context={{ templateId: template?.id }} />{" "}
        </Box>
      ) : null,
    [modal.openDelayed]
  );

  // Filter, Sort & Pagination
  // const { dataSorted, setSort, sortKey, sortAsc } = useSort<Template[]>(data || [], "updated_at");

  const dataWithCombinedProperty = (columns || []).map((item) => ({
    ...item,
    templateColumnNameAndId: `${item.name}_${item.id}_${item.key}_${item.description}`,
  }));

  const { dataFiltered, setFilter } = useFilter<TemplateColumn[]>(["templateColumnNameAndId"], dataWithCombinedProperty || []);

  const itemsPerPage = 25;
  const { dataPage, page, paginate, totalItems } = useSyncPagination(dataFiltered as any, itemsPerPage);

  // Data to table format

  const tableData = columnsTable(dataPage as any, update);
  const hasDescription = tableData?.[0]?.hasOwnProperty("Description");
  const columnWidths = hasDescription ? ["4%", "23%", "33%", "20%", "14%", "6%"] : ["4%", "38%", "38%", "14%", "6%"];

  return (
    <div className={style.templates}>
      <div className="container">
        <div className={style.header}>
          <div className={style.actions}>
            <Input
              icon={<PiMagnifyingGlass />}
              type="search"
              className={style.searchInput}
              placeholder="Search"
              onChange={(e: any) => setFilter(e.target.value)}
            />
          </div>
          <div className={style.actions}>
            <Button variants={["primary"]} tabIndex={-1} onClick={() => modal.setOpen(true)}>
              Add Column
            </Button>
          </div>
        </div>

        {columns && (
          <Table
            data={tableData}
            reorderable={true}
            onRowsReorder={handleRowsReorder}
            background="zebra"
            columnWidths={columnWidths}
            hideColumns={["id", "index"]}
          />
        )}

        {!!(totalItems && totalItems > itemsPerPage) && (
          <Pagination totalItems={totalItems} itemsPerPage={itemsPerPage} onPageChange={paginate} initialPage={page} />
        )}
      </div>

      {modal.openDelayed && (
        <Modal {...modal} useBox={false} useCloseButton>
          {modalContent}
        </Modal>
      )}
    </div>
  );
}
