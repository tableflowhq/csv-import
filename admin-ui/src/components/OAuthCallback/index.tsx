import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Errors } from "@tableflowhq/ui-library";
import useOAuthCallback from "../../api/useOAuthCallback";
import style from "../../features/forms/style/Form.module.scss";

export default function OAuthCallback() {
  const { mutate, isLoading, error, isSuccess } = useOAuthCallback();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => mutate(null), 500);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isSuccess) {
      navigate("/");
    }
  }, [isSuccess]);

  if (error) {
    return (
      <div>
        <Errors error={error} />
        <br />
        <div className={style.actions}>
          <Button type="submit" variants={["primary", "noMargin", "fullWidth"]} className={style.button} onClick={() => navigate("/")}>
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return <p>Loading...</p>;
}
