import { Styles } from "@chakra-ui/theme-tools";

export const styles: Styles = {
  global: {
    body: {
      fontFamily: "",
      color: "",
      bg: "",
      transitionProperty: "",
      transitionDuration: "",
      lineHeight: "",
    },
    "*::placeholder": {
      color: "",
    },
    "*, *::before, &::after": {
      borderColor: "",
    },

    "label, input, button, textarea, select": {
      font: "inherit",
      color: "inherit",
      fontWeight: "inherit",
      lineHeight: "inherit",
      backgroundColor: "transparent",
      border: "none",
      textAlign: "inherit",
      padding: 0,
      fontSize: "inherit",
      accentColor: "var(--color-primary)",
    },
    ".docs-story": {
      backgroundColor: "var(--color-background)",
    },
    "#root": {
      transition: "filter ease-out var(--speed), transform ease-out var(--speed)",
    },
    ".modal [data-root]": {
      filter: "blur(var(--blurred))",
      transform: "scale(0.99)",
    },
    "button:not(:disabled)": {
      cursor: "pointer",
    },
    "p:not(:last-child)": {
      marginBottom: "var(--m-s)",
    },
    a: {
      font: "inherit",
      color: "inherit",
      cursor: "pointer",
      _hover: {
        textDecoration: "none",
      },
    },
    strong: {
      fontWeight: "bold",
    },
    em: {
      fontStyle: "italic",
    },
    h1: {
      fontSize: "var(--font-size-h)",
      fontWeight: "700",
    },
    h2: {
      fontSize: "var(--font-size-xxl)",
      fontWeight: "500",
    },
    small: {
      fontSize: "var(--font-size-s)",
    },
    hr: {
      border: "1px solid var(--color-border)",
      borderWidth: "0 0 1px 0",
      margin: "var(--m-s) 0",
    },
    "svg.react-icon": {
      display: "block",
    },
  },
};
