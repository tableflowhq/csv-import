import type { DetailedHTMLProps, InputHTMLAttributes } from "react";

export type SwitchProps = DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
  label?: string;
  inputFirst?: boolean;
};
