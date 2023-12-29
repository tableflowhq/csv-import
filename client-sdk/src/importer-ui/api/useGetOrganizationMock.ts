import { UseQueryResult } from "react-query";

export default function useGetOrganizationMock(
  importerId: string,
  checkStatus: boolean
): any {
  const mockOrganizationStatus = {
    "feature-custom-styles": false,
    "feature-css-overrides": false,
  };

  const queryResult = {
    data: mockOrganizationStatus,
    error: null,
    isLoading: false,
    isError: false,
    isSuccess: true,
    isIdle: false,
    isFetching: false,
    status: "success",
  };

  return queryResult;
}
