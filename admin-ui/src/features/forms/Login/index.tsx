import { Link } from "react-router-dom";
import { isEmail, useForm } from "@mantine/form";
import { Button, Errors, Input, Modal, Tableflow, useModal, usePassword, validatePassword } from "@tableflowhq/ui-library";
import NoPassword from "../../messages/NoPassword";
import useLogin from "../../../api/useLogin";
import style from "../style/Form.module.scss";

export default function Login() {
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

  const { mutate, isLoading, error } = useLogin();

  const onSubmit = (values: any) => {
    mutate(values);
  };

  const passwordProps = usePassword();

  const modal = useModal();

  return (
    <div className={style.container}>
      <div className={style.logo}>
        <Tableflow color size="big" />
      </div>

      <p role="heading" className={style.welcome}>
        Welcome back! Please enter your details.
      </p>

      <form onSubmit={form.onSubmit(onSubmit)} aria-disabled={isLoading}>
        <fieldset disabled={isLoading}>
          <Input label="Email" placeholder="your@email.com" name="email" {...form.getInputProps("email")} />

          <Input label="Password" name="password" {...form.getInputProps("password")} {...passwordProps}>
            <a onClick={() => modal.setOpen(true)}>Forgot password?</a>
          </Input>
        </fieldset>

        <div className={style.actions}>
          <Button type="submit" variants={["primary"]} className={style.button} disabled={isLoading}>
            Login
          </Button>
        </div>

        <Errors error={error} />
      </form>

      <p className={style.footer}>
        Don’t have an account? <Link to="/signup">Sign up</Link>
      </p>

      {modal.openDelayed && (
        <Modal {...modal}>
          <NoPassword handleClose={modal.handleClose} />
        </Modal>
      )}
    </div>
  );
}
