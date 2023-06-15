import { useQuery, UseQueryResult } from "react-query";
import { User } from "./types";
import { get } from "./api";

export default function useGetUsers(): UseQueryResult<User[]> {
  return useQuery("users", () => getUsers());
}

async function getUsers(): Promise<User[]> {
  const response = await get("users");

  if (!response.ok) throw response.error;

  return response.data;
}
