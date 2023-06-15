import { useMutation, UseMutationResult } from "react-query";
import { ApiResponse } from "./types";
import { emailPasswordSignIn } from "supertokens-auth-react/recipe/thirdpartyemailpassword";

export default function useProfile(): UseMutationResult<ApiResponse<any>> {
  return useMutation((values) => setProfile(values));
}

async function setProfile(values: any): Promise<ApiResponse<any>> {
  const response = {
    ok: null,
    error: "not implemented",
  };

  if (!response.ok) throw response.error;

  // Owner account created, sign them in
  const signInResponse = await emailPasswordSignIn({
    formFields: [
      { id: "email", value: values.email },
      { id: "password", value: values.password },
    ],
  });

  if (!signInResponse?.status || signInResponse?.status?.indexOf("ERROR") > -1) {
    throw signInResponse.status;
  }

  return {
    ok: true,
    error: "",
    data: (signInResponse as any)?.user,
  };
}
