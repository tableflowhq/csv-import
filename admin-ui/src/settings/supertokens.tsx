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
      useShadowDom: false,
      resetPasswordUsingTokenFeature: {
        disableDefaultUI: true,
      },
      signInAndUpFeature: {
        providers: [Github.init(), Google.init()],
        disableDefaultUI: true,
      },
      onHandleEvent: (context) => {
        switch (context.action) {
          case "SUCCESS":
            const user = context.user;
            // @ts-ignore
            if (window["posthog"]) {
              // @ts-ignore
              window["posthog"].identify(user.id, { email: user.email }, {});
            }
            break;
        }
      },
    }),
    EmailVerification.init({ mode: "REQUIRED", disableDefaultUI: true }),
    Session.init(),
  ],
};
