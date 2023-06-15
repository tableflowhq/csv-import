import { useEffect } from "react";
import { Button, classes, Errors, isValidEmail, TagEditor, validateEmails } from "@tableflowhq/ui-library";
import { useForm } from "@mantine/form";
import useInvite from "../../../api/useInvite";
import { InviteProps } from "./types";
import style from "../style/Form.module.scss";

export default function Invite({ onSuccess, disableSkip, disableIntro, confirmLabel = "Invite" }: InviteProps) {
  const form = useForm({
    initialValues: {
      inviteEmails: [] as string[],
    },
    validate: {
      inviteEmails: validateEmails,
    },
  });

  const { mutate, isLoading, error, isSuccess } = useInvite();

  const isDone = isSuccess && !error && !isLoading;

  useEffect(() => {
    if (isDone && onSuccess) {
      onSuccess();
    }
  }, [isDone]);

  const onSubmit = (values: any) => {
    mutate(values);
  };

  return (
    <>
      <h2 className={classes([style.title, style.smallSpace])}>Invite teammates to TableFlow</h2>

      {!disableIntro && (
        <p className={style.intro}>
          TableFlow is intended for usage with your team, therefore, <br />
          consider inviting a few of your colleagues to give it a try.
        </p>
      )}

      <form onSubmit={form.onSubmit(onSubmit)} aria-disabled={isLoading}>
        <fieldset disabled={isLoading}>
          <label className={style.sectionTitle}>Send to:</label>

          <TagEditor
            placeholder="Add user emails"
            storageKey="onboard-emails"
            validation={(tag: string) => (!isValidEmail(tag) ? "This is not a valid email" : "")}
            onUpdate={(emails: string[]) => form.setFieldValue("inviteEmails", emails)}
            error={form.getInputProps("inviteEmails")?.error}
            clearNow={isDone}
          />
        </fieldset>

        <div className={style.actionsVertical}>
          <Button type="submit" variants={["primary", "noMargin"]} className={style.button} disabled={isLoading}>
            {confirmLabel}
          </Button>

          {!disableSkip && (
            <Button
              type="button"
              variants={["bare", "noMargin"]}
              className={style.button}
              disabled={isLoading}
              onClick={() => onSuccess && onSuccess()}>
              Skip for now
            </Button>
          )}
        </div>

        <Errors error={error} />
      </form>
    </>
  );
}
