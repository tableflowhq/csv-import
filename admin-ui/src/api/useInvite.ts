import { useMutation, UseMutationResult } from "react-query";
import { ApiResponse } from "./types";
import { post } from "./api";

export default function useInvite(): UseMutationResult<ApiResponse<any>> {
  return useMutation((values) => {
    return addUsers(values);
  });
}

async function addUsers(values: any): Promise<ApiResponse<any>> {
  if (!values.inviteEmails || values.inviteEmails.length === 0) {
    throw "No emails were added";
  }

  const inviteEmails = values.inviteEmails.map((v: string) => v.trim());

  const response = await post("users", {
    users: inviteEmails.map((email: string) => ({ email })),
  });

  if (!response.ok) throw response.error;

  return {
    ok: true,
    error: "",
    data: response.data,
  };
}
