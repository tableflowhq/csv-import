import { InputProps } from "@tableflow/ui-library/build/Input/types";

export type ListManagerProps = Omit<InputProps, "onChange"> & {
  formStyle?: string;
  onChange: (value: string[]) => void;
};
