import { useMutation, UseMutationResult } from "react-query";
import { ApiResponse } from "./types";
import { thirdPartySignInAndUp } from "supertokens-auth-react/recipe/thirdpartyemailpassword";

export default function useOAuthCallback(): UseMutationResult<ApiResponse<any>> {
  return useMutation(["oauth-callback"], () => oauthCallback());
}

async function oauthCallback(): Promise<ApiResponse<any>> {
  let response;
  try {
    response = await thirdPartySignInAndUp();
  } catch (err: any) {
    if (err.isSuperTokensGeneralError === true) {
      throw err.message;
    } else {
      throw "Something went wrong. Please try again or reach out to support@tableflow.com if the problem persists.";
    }
  }
  if (response.status === "OK") {
    if (response.createdNewUser) {
      // Sign up successful
    } else {
      // Sign in successful
    }
    return {
      ok: true,
      error: "",
      data: response,
    };
  } else {
    throw "No email provided by social login. Please use another form of login";
  }
}
