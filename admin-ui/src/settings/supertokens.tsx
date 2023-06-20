import { getAPIBaseURL } from "../api/api";
import EmailVerification from "supertokens-auth-react/recipe/emailverification";
import Session from "supertokens-auth-react/recipe/session";
import ThirdPartyEmailPassword, { Github, Google } from "supertokens-auth-react/recipe/thirdpartyemailpassword";

export function getApiDomain() {
  return getAPIBaseURL("v1");
}

export function getWebsiteDomain() {
  return window.location.origin;
}

export const superTokensConfig = {
  appInfo: {
    appName: "TableFlow",
    apiDomain: getApiDomain(),
    websiteDomain: getWebsiteDomain(),
  },
  // recipeList contains all the modules that you want to
  // use from SuperTokens. See the full list here: https://supertokens.com/docs/guides
  recipeList: [
    ThirdPartyEmailPassword.init({
      signInAndUpFeature: {
        providers: [Github.init(), Google.init()],
        disableDefaultUI: true,
      },
    }),
    EmailVerification.init({ mode: "REQUIRED", disableDefaultUI: true }),
    Session.init(),
  ],
};
