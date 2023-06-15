import { Link } from "react-router-dom";
import { Button, Errors, Input, Tableflow, usePassword, validatePassword } from "@tableflowhq/ui-library";
import { isEmail, useForm } from "@mantine/form";
import useSignUp from "../../../api/useSignUp";
import style from "../style/Form.module.scss";

export default function SignUp() {
  // const form = useForm({
  //   initialValues: {
  //     email: "",
  //     password: "",
  //   },

  //   validate: {
  //     email: isEmail("Invalid email"),
  //   },
  // });

  // const { mutate, isLoading, error } = useSignUp();

  // const onSubmit = (values: any) => {
  //   mutate(values);
  // };

  // const formErrors = Object.keys(form.errors).map((k) => ({ field: k, message: form.errors[k] }));

  // const errors = [...formErrors, error && (error as any)?.message && { message: (error as any).message }].filter((e) => e);

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

  return (
    <div className={style.container}>
      <div className={style.logo}>
        <Tableflow color size="big" />
      </div>

      <p role="heading" className={style.welcome}>
        Create an account
      </p>

      <form onSubmit={form.onSubmit((values) => onSubmit(values))}>
        <Input label="Email" placeholder="your@email.com" {...form.getInputProps("email")} required />

        <Input label="Password" name="password" {...form.getInputProps("password")} {...passwordProps}>
          <>At least 8 characters long</>
        </Input>

        <div className={style.actions}>
          <Button type="submit" variants={["primary"]} className={style.button} disabled={isLoading}>
            Get started
          </Button>
        </div>

        <Errors error={error} />
      </form>

      <p className={style.footer}>
        Already have an account? <Link to="/">Login</Link>
      </p>
    </div>
  );
}
