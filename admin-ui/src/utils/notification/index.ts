import { notifications } from "@mantine/notifications";
import { Notification } from "./types";

const styles = (type: string) => () => ({
  root: {
    backgroundColor: "var(--color-background-modal-hover)",
    "&::before": {
      backgroundColor: type === "error" ? "var(--color-error)" : "var(--color-green-ui)",
    },
  },
  title: { color: "var(--color-text)" },
  description: { color: "var(--color-text)" },
  //   closeButton: {
  //     color: theme.white,
  //     "&:hover": { backgroundColor: theme.colors.blue[7] },
  //   },
});

export default function notification({ type = "success", ...props }: Notification) {
  notifications.show({
    ...props,
    styles: styles(type),
    autoClose: 5000,
  });
}
