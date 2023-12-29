import { QueryClient, QueryClientProvider } from "react-query";
import { QueriesProps } from "./types";

const queriesConfig: any = {
  /* Available configuration settings: */
  // cacheTime,
  // enabled,
  // initialTableData,
  // initialTableDataUpdatedAt,
  // isTableDataEqual,
  // keepPreviousTableData,
  // notifyOnChangeProps,
  // notifyOnChangePropsExclusions,
  // onError,
  // onSettled,
  // onSuccess,
  // queryKeyHashFn,
  // refetchInterval,
  refetchIntervalInBackground: 1000 * 60 * 5,
  refetchOnMount: true,
  // refetchOnReconnect,
  refetchOnWindowFocus: false,
  retry: false,
  // retryOnMount,
  // retryDelay,
  // select,
  staleTime: 1000 * 60 * 5,
  // structuralSharing,
  // suspense,
  // useErrorBoundary,
};

const queryClient = new QueryClient({ defaultOptions: { queries: queriesConfig } });

export default function QueriesProvider({ children }: QueriesProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
