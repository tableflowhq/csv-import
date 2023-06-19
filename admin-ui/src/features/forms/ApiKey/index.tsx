import { Box, Button, Input, usePassword } from "@tableflowhq/ui-library";
import style from "../style/Form.module.scss";

export default function ApiKey() {
  const password = usePassword();

  return (
    <div className={style.apiKey}>
      <div className="container">
        <div className={style.header}>
          <div className={style.title}>
            <h1>Api Key</h1>
            <small>You can set and update the API Key.</small>
          </div>
        </div>
        <Box>
          <form>
            <Input label="API Key" {...password} />

            <div className={style.actions}>
              <Button type="button" variants={["tertiary"]} className={style.button}>
                Cancel
              </Button>
              <Button type="submit" variants={["primary"]} className={style.button}>
                Login
              </Button>
            </div>
          </form>
        </Box>
      </div>
    </div>
  );
}
