export type Modal = {
  handleClose: () => void;
  isOpen: boolean;
  setOpen: (value: boolean) => void;
  openDelayed?: boolean;
};

export type ModalProps = Partial<Modal> &
  React.HTMLProps<HTMLDivElement> & {
    useBox?: boolean;
    useCloseButton?: boolean;
    usePortal?: boolean;
  };
