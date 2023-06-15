import { useEffect } from "react";
import { Button, classes, Errors, Input } from "@tableflowhq/ui-library";
import { isEmail, useForm } from "@mantine/form";
import { useGetRolesDropdown } from "../../../api/useGetRoles";
import usePostUser from "../../../api/usePostUser";
import { UserProps } from "../types";
import style from "../style/Form.module.scss";

export default function User({ user, title, buttonLabel, onSuccess }: UserProps) {
  const form = useForm({
    initialValues: {
      email: user?.email || "",
      role: user?.role || "user",
      ...(user?.id ? { id: user.id } : {}),
    },

    validate: {
      email: isEmail("Invalid email"),
    },
  });

  const { mutate, isLoading, error, isSuccess } = usePostUser();

  useEffect(() => {
    if (isSuccess && onSuccess) onSuccess();
  }, [isSuccess]);

  const onSubmit = (values: any) => {
    mutate(values);
  };

  // Roles

  const { data: roles } = useGetRolesDropdown();

  return (
    <>
      <div className={style.formTop}>
        <h2 className={style.title}>{title || "User form"}</h2>
      </div>

      <form onSubmit={form.onSubmit(onSubmit)} aria-disabled={isLoading}>
        <fieldset disabled={isLoading}>
          <Input label="Email" placeholder="user@email.com" name="email" {...form.getInputProps("email")} required autoFocus />

          <Input
            placeholder="- select a role -"
            label="Role"
            name="role"
            {...form.getInputProps("role")}
            options={roles}
            required
            disabled={user?.role === "owner"}
          />
        </fieldset>

        <div className={classes([style.actions, style.compact])}>
          <Button type="submit" variants={["primary", "noMargin"]} className={style.button} disabled={isLoading}>
            {isLoading ? "Please Wait" : buttonLabel || "Submit"}
          </Button>
        </div>

        <Errors error={error} />
      </form>
    </>
  );
}
