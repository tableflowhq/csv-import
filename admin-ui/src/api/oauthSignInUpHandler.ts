import { getAuthorisationURLWithQueryParamsAndSetState } from "supertokens-auth-react/recipe/thirdpartyemailpassword";

async function oauthSignInUpHandler(provider: string): Promise<any> {
  try {
    const authUrl = await getAuthorisationURLWithQueryParamsAndSetState({
      providerId: provider,
      authorisationURL: `${window.location.origin}/auth/callback/${provider}`,
    });
    window.location.assign(authUrl);
  } catch (err: any) {
    if (err.isSuperTokensGeneralError === true) {
      return err.message;
    } else {
      return "Something went wrong. Please try again or reach out to support@tableflow.com if the problem persists.";
    }
  }
}

export default oauthSignInUpHandler;
