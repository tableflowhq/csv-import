import Box from "../../../components/Box";
import Button from "../../../components/Button";
import Errors from "../../../components/Errors";
import Input from "../../../components/Input";
import usePassword from "../../../components/Input/hooks/usePassword";
import Modal from "../../../components/Modal";
import useModal from "../../../components/Modal/hooks/useModal";
import useApiKey from "../../../api/useApiKey";
import { sizes } from "../../../settings/theme";
import classes from "../../../utils/classes";
import notification from "../../../utils/notification";
import style from "../style/Form.module.scss";
import ApiKeyConfirmation from "./ApiKeyConfirmation";
import { PiCopy } from "react-icons/pi";

export default function ApiKey({ workspaceId }: { workspaceId: string }) {
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
    <div>
      <div className={style.header}>
        <div className={classes([style.title, style.smallInnerSpace])}>
          <h3>API Key</h3>
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
                <PiCopy size={sizes.icon.large} className={style.iconFix} />
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
