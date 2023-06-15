import { ThemeProps } from "./types";

export default function ThemeProvider({ children }: ThemeProps): React.ReactElement {
  return <>{children}</>;
  // return (
  //   <MantineProvider>
  //     <Notifications position="bottom-center" />
  //     {children}
  //   </MantineProvider>
  // );
}
