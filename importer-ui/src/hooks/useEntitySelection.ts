import { useEffect, useState } from "react";
import { useModal } from "@tableflowhq/ui-library";

export type EntityId = string | null;
export type Action = "add" | "edit" | "delete" | "resetPassword" | null;
export type Update = (entityId: EntityId, action: Action) => void;

export default function useEntitySelection() {
  const [entityId, setEntityId] = useState<EntityId>(null);

  const [action, setAction] = useState<Action>(null);

  const modal = useModal();

  const { isOpen } = modal;

  const update: Update = (entityId, action) => {
    setEntityId(entityId);
    setAction(action);
    modal.setOpen(true);
  };

  useEffect(() => {
    if (!isOpen) setEntityId(null);
  }, [isOpen]);

  return { entityId, action, update, modal };
}
