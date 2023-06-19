import { useMutation, UseMutationResult } from "react-query";
import notification from "../utils/notification";
import { ApiResponse } from "./types";
import { sendVerificationEmail } from "supertokens-auth-react/recipe/emailverification";
import { emailPasswordSignUp } from "supertokens-auth-react/recipe/thirdpartyemailpassword";

export default function useSignUp(): UseMutationResult<ApiResponse<any>> {
  return useMutation(({ email, password }: any) => signUp(email, password));
}

async function signUp(email: string, password: string): Promise<ApiResponse<any>> {
  const response = await emailPasswordSignUp({
    formFields: [
      { id: "email", value: email },
      { id: "password", value: password },
    ],
  });

  if (!response?.status || response?.status?.indexOf("ERROR") > -1) {
    if (response?.status === "FIELD_ERROR") {
      // TODO: Have this set the error under the appropriate field bases on the field ID
      const errors = response?.formFields?.map((f) => f.error);
      if (errors.length !== 0) {
        throw errors.join(", ");
      }
    }
    throw response.status;
  }

  await handleSendVerificationEmail();

  return {
    ok: true,
    error: "",
    data: response,
  };
}

async function handleSendVerificationEmail() {
  try {
    let response = await sendVerificationEmail();
    if (response.status === "EMAIL_ALREADY_VERIFIED_ERROR") {
      // This can happen if the info about email verification in the session was outdated.
      // Redirect the user to the home page
      window.location.assign("/");
    } else {
      // Email was sent successfully.
      notification({ title: "Verification Email Sent", message: "Please check your email and click the link to verify your account." });
    }
  } catch (err: any) {
    console.error(err);
    if (err.isSuperTokensGeneralError === true) {
      // This may be a custom error message sent from the API by you
      notification({ title: "Error", message: err.message, type: "error", autoClose: false });
    } else {
      notification({
        title: "Error",
        message:
          "Something went wrong attempting to send a verification email. Please try again or reach out to support@tableflow.com if the problem persists.",
        type: "error",
        autoClose: false,
      });
    }
  }
}
