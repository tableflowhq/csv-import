import { Button } from "@tableflowhq/ui-library";
import useSendVerificationEmail from "../../api/useSendVerificationEmail";

export default function VerifyEmail() {
  const { mutate } = useSendVerificationEmail();

  return (
    <>
      <p>Validate email</p>
      <Button onClick={() => mutate(null)}>Re-send validation email</Button>
    </>
  );
}
