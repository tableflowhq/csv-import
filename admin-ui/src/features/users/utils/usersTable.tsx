import { Badge, capitalize, Dialog, timestampDisplay } from "@tableflowhq/ui-library";
import { DialogItem } from "@tableflowhq/ui-library/build/Dialog/types";
import { EntityId, Update } from "@tableflowhq/ui-library/build/hooks/useEntitySelection";
import { User } from "../../../api/types";
import { UserTableDatum } from "../types";

export function usersTable(users: User[] = [], update: Update): UserTableDatum[] {
  const actionMenu: DialogItem[] = [
    { children: "Edit", action: (id: EntityId) => update(id, "edit") },
    { children: "Delete", action: (id: EntityId) => update(id, "delete") },
    { children: "Reset Password", action: (id: EntityId) => update(id, "resetPassword") },
  ];

  return users.map((user) => {
    const result: UserTableDatum = {
      Email: user.email,
      "Date Created": { raw: user.time_joined, content: timestampDisplay(user.time_joined) },
      Role: {
        raw: user.role,
        content: (
          <span>
            <Badge variants={[user.role === "owner" ? "success" : user.role === "admin" ? "highlight" : "neutral"]}>{capitalize(user.role)}</Badge>
          </span>
        ),
      },
      _actions: {
        raw: user.id,
        content: <Dialog items={actionMenu.map((e) => ({ ...e, id: user.id }))} />,
      },
    };

    return result;
  });
}
