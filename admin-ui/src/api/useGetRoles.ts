import { useQuery, UseQueryResult } from "react-query";
import { capitalize } from "@tableflowhq/ui-library";
import { Role } from "./types";
import { get } from "./api";

export default function useGetRoles(): UseQueryResult<Role[]> {
  return useQuery("roles", () => getRoles());
}

export function useGetRolesDropdown() {
  const query = useGetRoles();

  const roles = query.data?.reduce((acc, role) => {
    return {
      ...acc,
      [capitalize(role.name)]: { value: role.name, disabled: role.name === "owner" },
    };
  }, {});

  return { ...query, data: roles };
}

async function getRoles(): Promise<Role[]> {
  const response = await get("roles");

  if (!response.ok) throw response.error;

  return response.data;
}
