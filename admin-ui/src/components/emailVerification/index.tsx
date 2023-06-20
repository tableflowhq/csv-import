import { useEffect } from "react";
import { Errors } from "@tableflowhq/ui-library";
import useVerifyEmail from "../../api/useVerifyEmail";

export default function EmailVerification() {
  const { mutate, isLoading, error, data } = useVerifyEmail();

  useEffect(() => {
    const timer = setTimeout(() => mutate(null), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (error) return <Errors error={error} />;

  return <p>Verifying email...</p>;
}
