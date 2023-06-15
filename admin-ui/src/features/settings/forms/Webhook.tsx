import { useForm } from "@mantine/form";
import { Button, Errors, Input } from "@tableflowhq/ui-library";
import { Importer } from "../../../api/types";
import usePostImporter from "../../../api/usePostImporter";
import style from "../style/Form.module.scss";

export default function Webhook({ importer }: { importer: Importer }) {
  const form = useForm({
    initialValues: {
      id: importer.id,
      webhook_url: importer.webhook_url || "",
    },
  });

  const { mutate, isLoading, error } = usePostImporter(importer.id);

  const onSubmit = (values: any) => {
    mutate(values);
  };

  return (
    <>
      <form onSubmit={form.onSubmit(onSubmit)} aria-disabled={isLoading} className={style.form}>
        <Input placeholder="https://" name="webhook_url" {...form.getInputProps("webhook_url")} icon="bell" required />
        <Button variants={["primary"]}>Save</Button>
      </form>

      {error && <Errors error={error} />}
    </>
  );
}
