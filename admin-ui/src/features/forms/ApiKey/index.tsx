import { Box, Button, classes, Errors, Icon, Input, Modal, useModal, usePassword } from "@tableflow/ui-library";
import useApiKey from "../../../api/useApiKey";
import useGetOrganization from "../../../api/useGetOrganization";
import notification from "../../../utils/notification";
import style from "../style/Form.module.scss";
import ApiKeyConfirmation from "./ApiKeyConfirmation";

export default function ApiKey() {
  const { data: organization } = useGetOrganization();

  const workspaceId = organization?.workspaces?.[0]?.id || "";

  const { data: apiKey, isLoading, error, update: updateApiKey } = useApiKey(workspaceId);

  const password = usePassword();

  const modal = useModal();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    notification({ type: "success", message: "Copied to clipboard" });
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    modal.setOpen(true);
  };

  const onConfirm = () => {
    updateApiKey && updateApiKey();
    modal.setOpen(false);
  };

  if (isLoading) return null;

  return (
    <div className={style.apiKey}>
      <div className={style.header}>
        <div className={classes([style.title, style.smallInnerSpace])}>
          <h1>API Key</h1>
          <small>
            View and update your API key used to access the data from your imports. The API docs can be found{" "}
            <a href="https://tableflow.com/docs/api-reference/get-import-rows" target="_blank">
              here
            </a>
          </small>
        </div>
      </div>
      <Box variants={["bg-shade"]}>
        <form onSubmit={onSubmit}>
          <div className={style.inputWithIcon}>
            <Input label="API Key" {...password} value={apiKey} readOnly />

            {apiKey && (
              <Button type="button" variants={["bare", "square"]} onClick={() => copyToClipboard(apiKey)} title="Copy to clipboard">
                <Icon icon="copy" size="m" className={style.iconFix} />
              </Button>
            )}
          </div>

          <div className={style.actions}>
            <Button type="submit" variants={["primary", "small"]} className={style.button}>
              Regenerate Key
            </Button>
          </div>

          {error && <Errors error={error} />}
        </form>
      </Box>

      {modal.openDelayed && (
        <Modal {...modal} useBox={false} useCloseButton>
          <Box variants={["wide", "space-mid"]}>
            <ApiKeyConfirmation onCancel={() => modal.setOpen(false)} onConfirm={onConfirm} />
          </Box>
        </Modal>
      )}
    </div>
  );
}
