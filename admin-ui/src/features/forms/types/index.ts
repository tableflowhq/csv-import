import { Importer, Template, TemplateColumn, User } from "../../../api/types";

export type FormProps = {
  title?: string;
  onSuccess?: () => void;
  buttonLabel?: string;
  context?: any;
};

export type UserProps = FormProps & {
  user?: User;
};

export type UserDeleteProps = FormProps & {
  user?: User;
};

export type UserResetProps = UserDeleteProps;

export type ImporterProps = FormProps & {
  importer?: Importer;
};

export type ImporterDeleteProps = ImporterProps;

export type TemplateColumnProps = FormProps & {
  column?: TemplateColumn;
};

export type TemplateDeleteProps = TemplateColumnProps;

export type PasswordResetProps = {
  token: string;
};
