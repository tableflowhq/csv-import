import { useMutation, UseMutationResult } from "react-query";
import { ApiResponse } from "./types";
import { sendVerificationEmail } from "supertokens-auth-react/recipe/emailverification";

export default function useSendVerificationEmail(): UseMutationResult<ApiResponse<any>> {
  return useMutation(() => send());
}

async function send(): Promise<ApiResponse<any>> {
  const response = await sendVerificationEmail();

  if (!response?.status || response?.status?.indexOf("ERROR") > -1) {
    throw response.status;
  }

  return {
    ok: true,
    error: "",
    data: response,
  };
}
