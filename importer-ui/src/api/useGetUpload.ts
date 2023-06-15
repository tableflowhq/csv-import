import { useEffect, useState } from "react";
import { useQuery, UseQueryResult } from "react-query";
import { ApiResponse, Upload } from "./types";
import { get } from "./api";

const config = { keepPreviousData: true };

export default function useGetUpload(tusId: string): UseQueryResult<Upload> {
  const [configOverrides, setConfigOverrides] = useState({});

  // TODO: @Leandro: Can you handle a 400 error here from the API and display it to the user? a 404 is ok
  // Do not try the request again if it is a 400

  const query: UseQueryResult<Upload> = useQuery(["upload", tusId], () => (tusId ? getUpload(tusId) : {}), { ...config, ...configOverrides });

  const isParsed = query?.data?.is_parsed;

  useEffect(() => {
    if (isParsed) {
      setConfigOverrides({ enabled: false });
    } else if (tusId) {
      setConfigOverrides({ refetchInterval: 100, retry: 20 });
    } else {
      setConfigOverrides({});
    }
  }, [isParsed, tusId]);

  return query;
}

async function getUpload(tusId: string) {
  const response: ApiResponse<Upload> = await get(`upload/${tusId}`, true);

  if (response.status == 400) {
    // TODO: response.error contains the nice error message you can display to the user
    const errorMessage = response.error;
    throw errorMessage;
  }

  if (!response.ok) throw response.error;

  return response.data;
}
