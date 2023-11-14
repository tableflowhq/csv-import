type Primitive = string | number | boolean | null | undefined;

export type DataType = { [key: string]: Primitive | Primitive[] | { [key: string]: Primitive } }[];

export type ApiResponse<T> = {
  ok: boolean;
  error: string;
  data: T;
  status: number;
};

// Entities

export type OrganizationFeatures = {
  [key: string]: boolean;
};

export type Importer = {
  id: string;
  name: string;
  skip_header_row_selection: boolean;
  template: Template;
};

export type Template = {
  id: string;
  name: string;
  columns: TemplateColumn[];
  is_sdk_defined?: boolean;
};

export type TemplateColumn = {
  id: string;
  name: string;
  key: string;
  description?: string;
  required?: boolean;
  suggested_mappings?: string[];
  validations?: Validation[];
};

export type Validation = {
  id?: number;
  validate: string;
  options?: any;
  message?: string;
  severity?: string;
};

export type Upload = {
  created_at: number;
  file_extension: string;
  file_name: string;
  file_type: string;
  header_row_index: number;
  matched_header_row_index?: number;
  id: string;
  is_stored: boolean;
  metadata: any;
  template_id: string;
  template?: Template;
  tus_id: string;
  upload_columns: UploadColumn[];
  upload_rows: UploadRow[];
  sheet_list?: string[];
};

export type UploadColumn = {
  id: string;
  index: number;
  name: string;
  sample_data: string[];
  suggested_template_column_id: string;
};

export type UploadRow = {
  index: number;
  values: Record<string, string>;
};

export type Import = {
  error?: string | null;
  created_at: number;
  file_extension: string;
  file_size: number;
  file_type: string;
  id: string;
  importer_id: string;
  is_stored: boolean;
  metadata: Record<string, any>;
  num_columns: number;
  num_processed_values: number;
  num_rows: number;
  upload_id: string;
  workspace_id: string;
  importer?: Importer;
};

type Pagination = {
  total: number;
  offset: number;
  limit: number;
  next_offset: number;
};

type ErrorDetail = {
  type: string;
  severity: string;
  message: string;
};

type Row = {
  index: number;
  values: {
    email: string;
    not_blank: string;
  };
  errors: {
    not_blank: ErrorDetail[];
  };
};

export type QueryFilter = "all" | "valid" | "error";

export type ImportRowResponse = {
  pagination: Pagination;
  filter: QueryFilter;
  rows: Row[];
};
