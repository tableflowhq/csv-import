import { Route, Routes } from "react-router-dom";
import SuperTokens from "supertokens-auth-react";
import { superTokensConfig } from "../settings/supertokens";
import checkIsEmailVerified from "../utils/verification";
import AnonymousRoutes from "./AnonymousRoutes";
import ApplicationRoutes from "./ApplicationRoutes";
import InvalidUserRoutes from "./InvalidUserRoutes";
import { SessionAuth, useSessionContext } from "supertokens-auth-react/recipe/session";

SuperTokens.init(superTokensConfig);

export default function AppRoutes() {
  const sessionContext = useSessionContext() as any;
  const { doesSessionExist, invalidClaims } = sessionContext;
  const isEmailVerified = checkIsEmailVerified(doesSessionExist, invalidClaims);

  if (sessionContext.loading) {
    return null;
  }

  if (!doesSessionExist) {
    return (
      <Routes>
        <Route path="*" element={<AnonymousRoutes />} />
      </Routes>
    );
  }

  if (!isEmailVerified) {
    return (
      <Routes>
        <Route path="*" element={<InvalidUserRoutes />} />
      </Routes>
    );
  }

  return (
    <Routes>
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
