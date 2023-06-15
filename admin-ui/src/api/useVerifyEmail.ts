import { useMutation, UseMutationResult } from "react-query";
import { ApiResponse } from "./types";
import { verifyEmail } from "supertokens-auth-react/recipe/emailverification";

export default function useVerifyEmail(): UseMutationResult<ApiResponse<any>> {
  return useMutation("email-verified", () => consumeVerificationCode());
}

async function consumeVerificationCode(): Promise<ApiResponse<any>> {
  const response = await verifyEmail();

  if (!response?.status || response?.status?.indexOf("ERROR") > -1) {
    throw response.status;
  }

  return {
    ok: true,
    error: "",
    data: response,
  };
}
