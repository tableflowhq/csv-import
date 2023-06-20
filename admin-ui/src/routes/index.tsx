import { Route, Routes } from "react-router-dom";
import SuperTokens from "supertokens-auth-react";
import { superTokensConfig } from "../settings/supertokens";
import AnonymousRoutes from "./AnonymousRoutes";
import ApplicationRoutes from "./ApplicationRoutes";
import InvalidUserRoutes from "./InvalidUserRoutes";
import { SessionAuth, useSessionContext } from "supertokens-auth-react/recipe/session";

SuperTokens.init(superTokensConfig);

export default function AppRoutes() {
  const sessionContext = useSessionContext() as any;

  const { doesSessionExist, invalidClaims, loading } = sessionContext;

  const isEmailverified = !(invalidClaims?.length > 0);

  if (loading) return null;

  return (
    <Routes>
      {!doesSessionExist && <Route path="*" element={<AnonymousRoutes />} />}

      {!isEmailverified && <Route path="*" element={<InvalidUserRoutes />} />}

      <Route
        path="*"
        element={
          <SessionAuth>
            <ApplicationRoutes />
          </SessionAuth>
        }
      />
    </Routes>
  );
}
