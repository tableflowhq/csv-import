import { Box, Button, classes, Errors, Input, usePassword } from "@tableflowhq/ui-library";
import useApiKey from "../../../api/useApiKey";
import useGetOrganization from "../../../api/useGetOrganization";
import notification from "../../../utils/notification";
import style from "../style/Form.module.scss";

export default function ApiKey() {
  const { data: organization } = useGetOrganization();

  const workspaceId = organization?.workspaces?.[0]?.id || "";

  const { data: apiKey, isLoading, error, update } = useApiKey(workspaceId);

  const password = usePassword();

  console.log("apiKey", apiKey);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    notification({ type: "success", message: "Copied to clipboard" });
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    update && update();
  };

  if (isLoading) return null;

  return (
    <div className={style.apiKey}>
      <div className="container">
        <div className={style.header}>
          <div className={classes([style.title, style.smallInnerSpace])}>
            <h1>API Key</h1>
            <small>View and update your API key used to access the data from your imports</small>
          </div>
        </div>
        <Box>
          <form onSubmit={onSubmit}>
            <div className={style.inputWithIcon}>
              <Input label="API Key" {...password} value={apiKey} />

              {apiKey && <Button icon="insert" type="button" variants={["bare"]} onClick={() => copyToClipboard(apiKey)} title="Copy to clipboard" />}
            </div>

            <div className={style.actions}>
              <Button type="submit" variants={["primary", "small"]} className={style.button}>
                Regenerate Key
              </Button>
            </div>

            {error && <Errors error={error} />}
          </form>
        </Box>
      </div>
    </div>
  );
}
