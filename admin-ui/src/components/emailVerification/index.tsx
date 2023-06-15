import { useEffect } from "react";
import { Errors } from "@tableflowhq/ui-library";
import useVerifyEmail from "../../api/useVerifyEmail";

export default function EmailVerification() {
  const { mutate, isLoading, error, data } = useVerifyEmail();

  useEffect(() => {
    const timer = setTimeout(() => mutate(null), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) return <p>Verifying token...</p>;

  if (error) return <Errors error={error} />;

  if (data) return <p>{data.toString()}</p>;

  return null;
}
