import { InputHTMLAttributes, ReactElement } from "react";

export type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string | ReactElement;
};
