type Primitive = string | number | boolean | null | undefined;

export type DataType = { [key: string]: Primitive | Primitive[] | { [key: string]: Primitive } }[];

export type ApiResponse<T> = {
  ok: boolean;
  error: string;
  data: T;
  status: number;
};

export type SqlCommand = "select" | "insert" | "update" | "delete";

// Entities

export type Importer = {
  id: string;
  name: string;
  template: Template;
};

export type Template = {
  id: string;
  name: string;
  template_columns: TemplateColumn[];
};

export type TemplateColumn = {
  id: string;
  name: string;
  description?: string;
  required?: boolean;
};

export type Upload = {
  created_at: number;
  file_extension: string;
  file_name: string;
  file_type: string;
  id: string;
  is_stored: boolean;
  metadata: any;
  template_id: string;
  tus_id: string;
  upload_columns: UploadColumn[];
};

export type UploadColumn = {
  id: string;
  index: number;
  name: string;
  sample_data: string[];
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
