import { SuperTokensWrapper } from "supertokens-auth-react";
import { AuthProps } from "./types";

export default function AuthProvider({ children }: AuthProps) {
  return <SuperTokensWrapper>{children}</SuperTokensWrapper>;
}
