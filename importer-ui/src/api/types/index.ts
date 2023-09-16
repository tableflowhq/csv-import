type Primitive = string | number | boolean | null | undefined;

export type DataType = { [key: string]: Primitive | Primitive[] | { [key: string]: Primitive } }[];

export type ApiResponse<T> = {
  ok: boolean;
  error: string;
  data: T;
  status: number;
};

// Entities

export type Organization = {
  status?: boolean;
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
};

export type Upload = {
  created_at: number;
  file_extension: string;
  file_name: string;
  file_type: string;
  header_row_index: number;
  id: string;
  is_stored: boolean;
  metadata: any;
  template_id: string;
  template?: Template;
  tus_id: string;
  upload_columns: UploadColumn[];
  upload_rows: UploadRow[];
};

export type UploadColumn = {
  id: string;
  index: number;
  name: string;
  sample_data: string[];
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
