import { useEffect } from "react";
import { isEmail, useForm } from "@mantine/form";
import { Button, Errors, Input } from "@tableflowhq/ui-library";
import useSendPasswordResetEmail from "../../../api/useSendPasswordResetEmail";
import notification from "../../../utils/notification";
import style from "../style/Form.module.scss";

export default function PasswordResetSendEmail() {
  const form = useForm({
    initialValues: {
      email: "",
    },
    validate: {
      email: isEmail("Invalid email"),
    },
  });

  const { mutate, isLoading, error, isSuccess } = useSendPasswordResetEmail();

  useEffect(() => {
    if (isSuccess) {
      notification({
        title: "Email Sent",
        message: "If an account with the provided email address exists, you will receive an email with a link to reset your password.",
      });
    }
  }, [isSuccess]);

  const onSubmit = (values: any) => {
    mutate(values);
  };

  return (
    <>
      <h2 className={style.title}>Reset Password</h2>

      <p role="heading" className={style.passwordResetSubtitle}>
        Enter your email address to reset your password
      </p>

      <form onSubmit={form.onSubmit(onSubmit)} aria-disabled={isLoading}>
        <Input label="Email" placeholder="your@email.com" name="email" {...form.getInputProps("email")} required />

        <div className={style.actions}>
          <Button type="submit" variants={["primary", "noMargin"]} className={style.button} disabled={isLoading}>
            {isLoading ? "Please Wait" : "Send Reset Email"}
          </Button>
        </div>

        <Errors error={error} />
      </form>
    </>
  );
}
