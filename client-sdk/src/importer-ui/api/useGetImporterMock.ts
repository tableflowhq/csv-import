import template from "../demo/template";
import { Importer, Template, TemplateColumn, Validation } from "./types";
import { UseQueryResult } from "react-query";

export default function useGetImporterMock(
  importerId: string,
  sdkDefinedTemplate: string,
  schemaless?: boolean
): any {
  const mockValidations: Validation[] = [
    {
      id: 1,
      validate: "isNotEmpty",
      options: {},
      message: "This field cannot be empty",
      severity: "error",
    },
  ];
  const mockTemplate: Template = template;
  const mockColumns: TemplateColumn[] = mockTemplate.columns;

  const mockImporter: Importer = {
    id: "mockImporterId",
    name: "Mock Importer",
    template: mockTemplate,
  };

  const queryResult = {
    data: mockImporter,
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
