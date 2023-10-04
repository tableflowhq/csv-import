export interface Option {
    label: string;
    filterValue: string,
    selected: boolean;
    color?: string;
  }
  
 export interface ToggleFilterProps {
    options: Option[];
    className?: string;
    onChange: (option: string) => void;
  }