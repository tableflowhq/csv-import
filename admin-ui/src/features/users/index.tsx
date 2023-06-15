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
} from "@tableflowhq/ui-library";
import UserForm from "../forms/User";
import UserDelete from "../forms/User/UserDelete";
import UserReset from "../forms/User/UserReset";
import { User } from "../../api/types";
import useGetUsers from "../../api/useGetUsers";
import NoUsersFound from "./components/NoUsersFound";
import { usersTable } from "./utils/usersTable";
import style from "./style/Users.module.scss";

export default function Users() {
  const { isLoading, data } = useGetUsers();

  // Modals

  const { entityId, action, update, modal } = useEntitySelection();

  const user = data?.find((user) => user.id === entityId);

  const modalContent = useMemo(
    () =>
      !entityId ? (
        <Box>
          <UserForm title="Add New User" buttonLabel="Add Now" onSuccess={modal.handleClose} user={user} />
        </Box>
      ) : action === "edit" ? (
        <Box>
          <UserForm title="Edit User" buttonLabel="Edit Now" onSuccess={modal.handleClose} user={user} />
        </Box>
      ) : action === "delete" ? (
        <Box variants={["wide", "space-mid"]}>
          <UserDelete user={user} onSuccess={modal.handleClose} />
        </Box>
      ) : (
        <UserReset user={user} onSuccess={modal.handleClose} />
      ),
    [modal.openDelayed]
  );

  // Filter & Pagination

  const { dataFiltered, setFilter } = useFilter<User[]>(["role", "email"], data || []);

  const itemsPerPage = 10;

  const { dataPage, page, paginate, totalItems } = useSyncPagination(dataFiltered as any, itemsPerPage);

  // Parse data to table format

  const tableData = usersTable(dataPage as User[], update);

  if (isLoading) return null;

  if (!data) return <>Data malformed</>;

  return (
    <div className={style.usersPage}>
      <div className="container">
        <div className={style.header}>
          <div className={style.title}>
            <h1>User Management</h1>
            <small>{collectionCountLabel("No users", "user", "users", data.length, "No", "users found in", dataFiltered.length)}</small>
          </div>

          <div className={style.actions}>
            <Input icon="search" type="search" className={style.searchInput} placeholder="Search" onChange={(e: any) => setFilter(e.target.value)} />
            <Button variants={["primary"]} onClick={() => modal.setOpen(true)}>
              Add New User
            </Button>
          </div>
        </div>

        <Table data={tableData} keyAsId="Email" /* sortByColumns={"ALL"} */ emptyState={<NoUsersFound />} />

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
