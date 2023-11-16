import { ReactElement } from "react";

export type PillProps = {
  label?: string | ReactElement;
  className?: string;
  error?: boolean;
  variants?: string[];
  placeholder?: string;
  onChange?: (tokens: string[]) => void;
  initialPills?: string[];
};
