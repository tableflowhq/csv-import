export type CompleteProps = {
  reload: () => void;
  close: () => void;
  onSuccess: (data: any, error: string) => void;
};
