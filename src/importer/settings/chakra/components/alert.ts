// import { defineStyleConfig } from "@chakra-ui/styled-system";
import { extendTheme } from "@chakra-ui/react";

const Alert = extendTheme({
  baseStyle: (props: { status: string; }) => ({
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
