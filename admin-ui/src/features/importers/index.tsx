import { useMemo } from "react";
import {
  Box,
  Button,
  collectionCountLabel,
  Input,
  Modal,
  Pagination,
  Table,
  useEntitySelection,
  useFilter,
  useSyncPagination,
} from "@tableflow/ui-library";
import ImporterForm from "../forms/Importer";
import ImporterDelete from "../forms/Importer/ImporterDelete";
import { Importer } from "../../api/types";
import useGetImporters from "../../api/useGetImporters";
import useGetOrganization from "../../api/useGetOrganization";
import { importersTable } from "./utils/importersTable";
import style from "./style/Importers.module.scss";

export default function Importers() {
  const { data: organization } = useGetOrganization();

  const workspaceId = organization?.workspaces?.[0]?.id || "";

  const { isLoading, data: importers } = useGetImporters(workspaceId);

  // Modals

  const { entityId, action, update, modal } = useEntitySelection();

  const importer = importers?.find((importer) => importer.id === entityId);

  const modalContent = useMemo(
    () =>
      !entityId ? (
        <Box variants={["wide", "space-mid"]}>
          <ImporterForm title="Create Importer" buttonLabel="Add" onSuccess={modal.handleClose} context={{ workspaceId }} />
        </Box>
      ) : action === "edit" ? (
        <Box>
          <ImporterForm title="Edit Importer" buttonLabel="Save" onSuccess={modal.handleClose} importer={importer} context={{ workspaceId }} />
        </Box>
      ) : action === "delete" ? (
        <Box variants={["wide", "space-mid"]}>
          <ImporterDelete importer={importer} onSuccess={modal.handleClose} context={{ workspaceId }} />
        </Box>
      ) : null,
    [modal.openDelayed]
  );

  // Filter, Sort & Pagination

  // const { dataSorted, setSort, sortKey, sortAsc } = useSort<Importer[]>(data || [], "updated_at");

  const { dataFiltered, setFilter } = useFilter<Importer[]>(["name"], importers || []);

  const itemsPerPage = 10;
  const { dataPage, page, paginate, totalItems } = useSyncPagination(dataFiltered as any, itemsPerPage);

  // Data to table format

  const tableData = importersTable(dataPage as any, update);

  if (isLoading) return null;

  return (
    <div className={style.importers}>
      <div className="container">
        <div className={style.header}>
          <div className={style.title}>
            <h1>Importers</h1>
            {!isLoading && (
              <small>
                {collectionCountLabel(
                  "No importers",
                  "importer",
                  "importers",
                  importers?.length || 0,
                  "No",
                  "importers found in",
                  dataFiltered.length
                )}
              </small>
            )}
          </div>

          <div className={style.actions}>
            <Input icon="search" type="search" className={style.searchInput} placeholder="Search" onChange={(e: any) => setFilter(e.target.value)} />
            <Button variants={["primary"]} tabIndex={-1} onClick={() => modal.setOpen(true)}>
              Create New
            </Button>
          </div>
        </div>

        {importers && (
          <Table
            data={tableData}
            /* heading={<Heading {...{ setSort, sortKey, sortAsc }} />} */ background="zebra"
            columnWidths={["34%", "30%", "30%", "6%"]}
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
