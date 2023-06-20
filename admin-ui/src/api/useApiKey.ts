import { useEffect, useState } from "react";
import { get, post } from "./api";

type QueryResult = {
  data: string;
  isLoading: boolean;
  error: string;
  update?: () => void;
};

export default function useApiKey(workspaceId?: string): QueryResult {
  const [query, setQuery] = useState({ data: "", isLoading: false, error: "" });

  useEffect(() => {
    if (workspaceId) {
      getApiKey(workspaceId).then((result) => {
        setQuery(result);
      });
    }
  }, [workspaceId]);

  const update = () => postApiKey(workspaceId).then((result) => setQuery(result));

  return { ...query, update };
}

async function getApiKey(workspaceId?: string): Promise<QueryResult> {
  const response = await get(`workspace/${workspaceId}/api-key`);

  if (!response.ok) return { data: "", isLoading: false, error: response.error };

  return { data: response.data, isLoading: false, error: "" };
}

async function postApiKey(workspaceId?: string): Promise<QueryResult> {
  const response = await post(`workspace/${workspaceId}/api-key`, "");

  if (!response.ok) return { data: "", isLoading: false, error: response.error };

  return { data: response.data, isLoading: false, error: "" };
}
