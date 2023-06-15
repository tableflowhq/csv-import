import { NotificationProps } from "@mantine/notifications/lib";

export type Notification = NotificationProps & {
  type?: string;
};
