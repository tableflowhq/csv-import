import { useMutation, UseMutationResult } from "react-query";
import { ApiResponse } from "./types";
import { sendPasswordResetEmail } from "supertokens-auth-react/recipe/thirdpartyemailpassword";

export default function useSendPasswordResetEmail(): UseMutationResult<ApiResponse<any>> {
  return useMutation(({ email }: any) => handleSendPasswordResetEmail(email));
}

async function handleSendPasswordResetEmail(email: string): Promise<ApiResponse<any>> {
  const response = await sendPasswordResetEmail({
    formFields: [{ id: "email", value: email }],
  });

  if (!response?.status || response?.status?.indexOf("ERROR") > -1) {
    throw (response as any)?.formFields?.[0]?.error || response.status;
  }

  return {
    ok: true,
    error: "",
    data: response?.status,
  };
}
