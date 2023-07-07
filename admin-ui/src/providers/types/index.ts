import React, { Dispatch, SetStateAction } from "react";

export type ProvidersProps = React.PropsWithChildren<{}>;
export type RouterProps = React.PropsWithChildren<{}>;
export type QueriesProps = React.PropsWithChildren<{}>;
export type ThemeProps = React.PropsWithChildren<{}>;

export type AuthConfig = {
  sessionExists: boolean;
  verified: boolean;
  showProfile: boolean;
  setAuthConfig?: Dispatch<SetStateAction<AuthConfig>>;
  signOut?: () => void;
};

export type AuthProps = React.PropsWithChildren<{}>;
