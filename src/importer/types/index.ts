export type Template = {
  columns: TemplateColumn[];
};

export type TemplateColumn = {
  name: string;
  key: string;
  description?: string;
  required?: boolean;
  suggested_mappings?: string[];
};

export type UploadColumn = {
  index: number;
  name: string;
  sample_data: string[];
};
