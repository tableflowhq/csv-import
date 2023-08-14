import { useMemo } from "react";
import { Box, Button, Input, Modal, Pagination, Table, useEntitySelection, useFilter, useSyncPagination } from "@tableflow/ui-library";
import TemplateColumnForm from "../forms/Template";
import TemplateColumnDelete from "../forms/Template/templateColumnDelete";
import { TemplateColumn } from "../../api/types";
import useGetTemplate from "../../api/useGetTemplate";
import { columnsTable } from "./utils/columnsTable";
import { TemplatesProps } from "./types";
import style from "./style/Templates.module.scss";

export default function Templates({ importer }: TemplatesProps) {
  const { template } = importer;

  // const columns = template.template_columns;

  const { data } = useGetTemplate(template.id);

  const columns = data?.template_columns;

  // Modals

  const { entityId, action, update, modal } = useEntitySelection();

  const column = columns?.find((column) => column.id === entityId);

  const modalContent = useMemo(
    () =>
      !entityId ? (
        <Box variants={["wide", "space-mid"]}>
          <TemplateColumnForm
            title="Add Column"
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

  const { dataFiltered, setFilter } = useFilter<TemplateColumn[]>(["name"], columns || []);

  const itemsPerPage = 25;
  const { dataPage, page, paginate, totalItems } = useSyncPagination(dataFiltered as any, itemsPerPage);

  // Data to table format

  const tableData = columnsTable(dataPage as any, update);
  const hasDescription = tableData?.[0]?.hasOwnProperty("Description");
  const columnWidths = hasDescription ? ["24%", "30%", "20%", "20%", "6%"] : ["54%", "20%", "20%", "6%"];

  return (
    <div className={style.templates}>
      <div className="container">
        <div className={style.header}>
          <div className={style.actions}>
            <Input icon="search" type="search" className={style.searchInput} placeholder="Search" onChange={(e: any) => setFilter(e.target.value)} />
          </div>
          <div className={style.actions}>
            <Button variants={["primary"]} tabIndex={-1} onClick={() => modal.setOpen(true)}>
              Add Column
            </Button>
          </div>
        </div>

        {columns && <Table data={tableData} background="zebra" columnWidths={columnWidths} />}

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
