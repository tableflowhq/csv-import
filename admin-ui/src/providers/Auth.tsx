import { createContext, useState } from "react";
import { AuthConfig, AuthProps } from "./types";

const defaultAuth: AuthConfig = {
  sessionExists: true,
  verified: true,
  showProfile: false,
};

const AuthContext = createContext(defaultAuth);

export default function AuthProvider({ children }: AuthProps) {
  const [authConfig, setAuthConfig] = useState(defaultAuth);

  return <AuthContext.Provider value={{ ...authConfig, setAuthConfig }}>{children}</AuthContext.Provider>;
}

export { AuthContext };
