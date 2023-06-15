import { useEffect } from "react";
import { Button, Errors, Input, usePassword, validatePassword } from "@tableflowhq/ui-library";
import { isEmail, useForm } from "@mantine/form";
import { useGetRolesDropdown } from "../../../api/useGetRoles";
import useProfile from "../../../api/useProfile";
import { FormProps } from "../types";
import style from "../style/Form.module.scss";

export default function AdminProfile({ onSuccess }: FormProps) {
  const form = useForm({
    initialValues: {
      email: "",
      role: "Owner",
      password: "",
      passwordConfirm: "",
    },

    validate: {
      email: isEmail("Invalid email"),
      password: (value) => (value && !validatePassword(value)[0] ? validatePassword(value)[1] : null),
      passwordConfirm: (value) => passwordsMatch(value),
    },
  });

  const passwordsMatch = (value: string): string | null => {
    return value === form.values.password ? null : "Passwords do not match";
  };

  const { mutate, isLoading, error, isSuccess } = useProfile();

  useEffect(() => {
    if (isSuccess && onSuccess) onSuccess();
  }, [isSuccess]);

  const onSubmit = (values: any) => {
    mutate(values);
  };

  const passwordProps = usePassword();

  const { data: roles } = useGetRolesDropdown();

  return (
    <>
      <h2 className={style.title}>Create a team owner</h2>

      <form onSubmit={form.onSubmit(onSubmit)} aria-disabled={isLoading}>
        <fieldset disabled={isLoading}>
          <Input label="Your Email" placeholder="your@email.com" name="email" {...form.getInputProps("email")} required />

          <Input label="Your Role" name="name" {...form.getInputProps("role")} options={roles} disabled />

          <Input label="Password" name="password" {...form.getInputProps("password")} {...passwordProps} required />

          <Input label="Re-enter password" name="password-confirm" {...form.getInputProps("passwordConfirm")} {...passwordProps} required />
        </fieldset>

        <div className={style.actions}>
          <Button type="submit" variants={["primary", "noMargin"]} className={style.button} disabled={isLoading}>
            {isLoading ? "Please Wait" : "Continue"}
          </Button>
        </div>

        <Errors error={error} />
      </form>
    </>
  );
}
