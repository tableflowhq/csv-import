import { useEffect } from "react";
import { useForm } from "@mantine/form";
import { Button, Errors, Input, usePassword, validatePassword } from "@tableflowhq/ui-library";
import usePasswordReset from "../../../api/usePasswordReset";
import { PasswordResetProps } from "../types";
import style from "../style/Form.module.scss";

export default function PasswordResetChangePassword({ token }: PasswordResetProps) {
  const form = useForm({
    initialValues: {
      token: token || "",
      password: "",
      passwordConfirm: "",
    },
    validate: {
      password: (value) => (value && !validatePassword(value)[0] ? validatePassword(value)[1] : null),
      passwordConfirm: (value) => passwordsMatch(value),
    },
  });

  const passwordsMatch = (value: string): string | null => {
    return value === form.values.password ? null : "Passwords do not match";
  };

  const { mutate, isLoading, error, isSuccess } = usePasswordReset();

  useEffect(() => {
    if (isSuccess) window.location.href = "/";
  }, [isSuccess]);

  const onSubmit = (values: any) => {
    mutate(values);
  };

  const passwordProps = usePassword();

  return (
    <>
      <h2 className={style.title}>Reset Password</h2>

      <form onSubmit={form.onSubmit(onSubmit)} aria-disabled={isLoading}>
        <Input label="New password" name="password" {...form.getInputProps("password")} {...passwordProps} required />

        <Input label="Re-enter new password" name="password-confirm" {...form.getInputProps("passwordConfirm")} {...passwordProps} required />

        <div className={style.actions}>
          <Button type="submit" variants={["primary", "noMargin"]} className={style.button} disabled={isLoading}>
            {isLoading ? "Please Wait" : "Reset Password"}
          </Button>
        </div>

        <Errors error={error} />
      </form>
    </>
  );
}
