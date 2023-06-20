import { useSearchParams } from "react-router-dom";
import PasswordResetChangePassword from "../PasswordResetChangePassword";
import PasswordResetSendEmail from "../PasswordResetSendEmail";

export default function PasswordReset() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  if (token) {
    return <PasswordResetChangePassword token={token} />;
  }
  return <PasswordResetSendEmail />;
}
