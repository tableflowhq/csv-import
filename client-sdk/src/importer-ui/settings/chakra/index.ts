import { Alert } from "./components/alert";
import { Button } from "./components";
import { foundations } from "./foundations";
import { semanticTokens } from "./semantic-tokens";
import { styles } from "./styles";
import type { ThemeConfig, ThemeDirection } from "./theme.types";

const direction: ThemeDirection = "ltr";

const config: ThemeConfig = {
  useSystemColorMode: false,
  initialColorMode: "light",
  cssVarPrefix: "external",
};

const theme = {
  semanticTokens,
  direction,
  ...foundations,
  styles,
  config,
  components: {
    Button,
    Alert,
  },
};

export default theme;
