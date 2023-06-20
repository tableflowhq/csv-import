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

  return (
    <Routes>
      {!doesSessionExist && <Route path="*" element={<AnonymousRoutes />} />}

      {!isEmailVerified && <Route path="*" element={<InvalidUserRoutes />} />}

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
