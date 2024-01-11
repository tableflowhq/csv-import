import { defineStyleConfig } from "@chakra-ui/styled-system";

const Alert = defineStyleConfig({
  baseStyle: (props) => ({
    container: {
      backgroundColor: props.status === "info" ? "var(--color-background-modal)" : "",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--border-radius-2)",
      fontWeight: "400",
    },
    title: {
      color: "inherit",
    },
    description: {
      color: "inherit",
    },
    icon: {
      color: "inherit",
    },
  }),
});

export { Alert };
