import { useMutation, UseMutationResult } from "react-query";
import { ApiResponse } from "./types";
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

  return {
    ok: true,
    error: "",
    data: response,
  };
}
