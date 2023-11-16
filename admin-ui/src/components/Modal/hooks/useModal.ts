import { useState } from "react";
import useDelayUnmount from "../../../hooks/useDelayUnmount";
import { Modal } from "../types";

export default function useModal(): Modal {
  const [open, setOpen] = useState(false);

  const openDelayed = useDelayUnmount(open, 600);

  return { handleClose: () => setOpen(false), isOpen: open, setOpen, openDelayed };
}
