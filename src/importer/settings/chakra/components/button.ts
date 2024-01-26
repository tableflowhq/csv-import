import { extendTheme } from "@chakra-ui/react";

const Button = extendTheme({
  // The styles all buttons have in common
  baseStyle: {
    fontWeight: "normal",
    borderRadius: "base",
    height: "auto",
    lineHeight: "1",
    fontSize: "inherit",
  },

  sizes: {
    sm: {
      fontSize: "sm",
      px: 4,
      py: 3,
    },
    md: {
      fontSize: "md",
      px: 6,
      py: 4,
    },
  },

  variants: {
    solid: (props: { colorScheme: string; }) => {
      if (props.colorScheme === "secondary") {
        return {
          color: "var(--color-text-on-secondary)",
        };
      }
      return {
        color: "var(--color-text-on-primary)",
      };
    },
  },

  defaultProps: {
    // variant: "outline",
  },
});

export { Button };
