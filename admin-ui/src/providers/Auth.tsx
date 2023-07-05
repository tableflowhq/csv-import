import { createContext, Dispatch, SetStateAction, useState } from "react";
import { AuthProps } from "./types";

type AuthConfig = {
  sessionExists: boolean;
  verified: boolean;
  showProfile: boolean;
  setAuthConfig?: Dispatch<SetStateAction<AuthConfig>>;
  signOut?: () => void;
};

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
