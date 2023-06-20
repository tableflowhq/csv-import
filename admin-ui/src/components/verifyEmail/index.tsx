import { useEffect } from "react";
import { Button, Errors } from "@tableflowhq/ui-library";
import useSendVerificationEmail from "../../api/useSendVerificationEmail";
import notification from "../../utils/notification";

export default function VerifyEmail() {
  const { mutate, isLoading, error, isSuccess } = useSendVerificationEmail();
  const isDone = isSuccess && !error && !isLoading;

  useEffect(() => {
    if (isDone) {
      notification({ title: "Email Sent", message: "Please check your email and click the link to verify your account." });
    }
  }, [isDone]);

  return (
    <>
      <p>Verify your email</p>
      <Button disabled={isLoading} onClick={() => mutate(null)}>
        Re-send verification email
      </Button>
      <Errors error={error} />
    </>
  );
}
