import { useMutation, UseMutationResult } from "react-query";
import { ApiResponse } from "./types";
import { submitNewPassword } from "supertokens-auth-react/recipe/emailpassword";

export default function usePasswordReset(): UseMutationResult<ApiResponse<any>> {
  return useMutation(({ password }: any) => resetPassword(password));
}

async function resetPassword(password: string): Promise<ApiResponse<any>> {
  const response = await submitNewPassword({
    formFields: [{ id: "password", value: password }],
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
