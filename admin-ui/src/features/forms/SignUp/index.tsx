import { useState } from "react";
import { Link } from "react-router-dom";
import { isEmail, useForm } from "@mantine/form";
import { Button, capitalize, Errors, Input, Tableflow, usePassword, useThemeStore, validatePassword } from "@tableflowhq/ui-library";
import oauthSignInUpHandler from "../../../api/oauthSignInUpHandler";
import useSignUp from "../../../api/useSignUp";
import style from "../style/Form.module.scss";

export default function SignUp() {
  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },

    validate: {
      email: isEmail("Invalid email"),
      password: (value) => (value && !validatePassword(value)[0] ? validatePassword(value)[1] : null),
    },
  });
  const { mutate, isLoading, error } = useSignUp();
  const onSubmit = (values: any) => {
    mutate(values);
  };
  const passwordProps = usePassword();
  const theme = useThemeStore((state) => state.theme);
  const [isLoadingSSO, setIsLoadingSSO] = useState(false);
  const [ssoError, setSsoError] = useState("");

  return (
    <div className={style.container}>
      <div className={style.logo}>
        <Tableflow color size="big" />
      </div>

      <p role="heading" className={style.welcome}>
        Create an account to get started.
      </p>

      <div className={style.oauthButtons}>
        {["google", "github"].map((provider) => {
          return (
            <Button
              key={provider}
              icon={provider as any}
              variants={["tertiary", "fullWidth"]}
              className={style.oauthButton}
              disabled={isLoading || isLoadingSSO}
              onClick={() => {
                setIsLoadingSSO(true);
                oauthSignInUpHandler(provider).then((err) => {
                  if (err) {
                    setSsoError(err);
                    setIsLoadingSSO(false);
                  }
                });
              }}>
              Login with {capitalize(provider)}
            </Button>
          );
        })}
      </div>

      <div className={style.separator}>Or</div>

      <form onSubmit={form.onSubmit((values) => onSubmit(values))}>
        <fieldset disabled={isLoading || isLoadingSSO}>
          <Input label="Email" placeholder="your@email.com" {...form.getInputProps("email")} required />

          <Input label="Password" name="password" {...form.getInputProps("password")} {...passwordProps}>
            <>At least 8 characters long</>
          </Input>
        </fieldset>

        <div className={style.actions}>
          <Button type="submit" variants={["primary", "fullWidth"]} className={style.button} disabled={isLoading || isLoadingSSO}>
            Get started
          </Button>
        </div>

        <Errors error={error || ssoError} />
      </form>

      <p className={style.footer}>
        Already have an account?{" "}
        <Link className={isLoading || isLoadingSSO ? style.disabledLink : ""} to="/">
          Login
        </Link>
      </p>
    </div>
  );
}
