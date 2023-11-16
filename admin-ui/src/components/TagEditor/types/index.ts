export type TagEditorProps = React.HTMLAttributes<HTMLDivElement> & {
  placeholder?: string;
  storageKey: string;
  clearOnUnmount?: boolean;
  clearNow?: boolean;
  validation?: (tag: string) => string;
  onUpdate: (tags: string[]) => void;
  error?: string;
  initialValue?: string[];
};

export type TagProps = {
  text: string;
  id: number;
  removeTag: (id: number) => void;
  editTag: (id: number, text: string) => void;
  validation?: (tag: string) => string;
};
