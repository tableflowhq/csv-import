type Primitive = string | number | boolean | null | undefined;

export type DataType = { [key: string]: Primitive | Primitive[] | { [key: string]: Primitive } }[];

export type ApiResponse<T> = {
  ok: boolean;
  error: string;
  data: T;
};

export type Status = {
  internal_database_connected: boolean;
  owner_exists: boolean;
};

export type UserFormFields = {
  email: string;
  role: string;
  id?: string;
};

export type Role = {
  name: string;
  permissions: string[];
};

export type SqlCommand = "select" | "insert" | "update" | "delete";

export type User = {
  email: string;
  id: string;
  recipe: string;
  role: string;
  time_joined: number;
};

export type WorkspaceLimit = {
  files: number;
  id: string;
  importers: number;
  processed_values: number;
  rows: number;
  rows_per_import: number;
  users: number;
  workspace_id: string;
};

export type Workspace = {
  created_at: number;
  created_by: User;
  id: string;
  name: string;
  updated_at: number;
  updated_by: User;
  users: User[];
  workspace_limit: WorkspaceLimit;
};

export type Organization = {
  created_at: number;
  created_by: User;
  id: string;
  name: string;
  updated_at: number;
  updated_by: User;
  users: User[];
  workspaces: Workspace[];
};

export type ImporterFormFields = {
  id: string;
  name: string;
};

export type Importer = Required<ImporterFormFields> & {
  allowed_domains: string[];
  created_at: number;
  created_by: User;
  template: Template;
  updated_at: number;
  updated_by: User;
  webhook_url: string;
  workspace_id: string;
  webhooks_enabled: boolean;
  skip_header_row_selection: boolean;
};

export type TemplateColumnFormFields = {
  id: string;
  key: string;
  name: string;
  description?: string;
  required: boolean;
};

export type TemplateColumn = Required<TemplateColumnFormFields> & {
  created_at: number;
  created_by: User;
  template_id: string;
  updated_at: number;
  updated_by: User;
};

export type Template = {
  created_at: number;
  created_by: User;
  id: string;
  importer_id: string;
  name: string;
  template_columns: TemplateColumn[];
  updated_at: number;
  updated_by: User;
  workspace_id: string;
};

export type Import = {
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
