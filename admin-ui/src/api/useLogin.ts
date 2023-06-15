import { useMutation, UseMutationResult } from "react-query";
import { ApiResponse } from "./types";
import { emailPasswordSignIn } from "supertokens-auth-react/recipe/thirdpartyemailpassword";

export default function useLogin(): UseMutationResult<ApiResponse<any>> {
  return useMutation(({ email, password }: any) => emailLogin(email, password));
}

async function emailLogin(email: string, password: string): Promise<ApiResponse<any>> {
  const response = await emailPasswordSignIn({
    formFields: [
      { id: "email", value: email },
      { id: "password", value: password },
    ],
  });

  if (!response?.status || response?.status?.indexOf("ERROR") > -1) {
    throw response.status;
  }

  return {
    ok: true,
    error: "",
    data: (response as any)?.user,
  };
}
