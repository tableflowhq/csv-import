import { Box } from "@tableflowhq/ui-library";
import { Button } from "@tableflowhq/ui-library";
import Reset from "../../messages/Reset";
import { UserResetProps } from "../types";

export default function UserReset({ onSuccess = () => null }: UserResetProps) {
  return (
    <Box variants={["mid"]}>
      <Reset>
        <h2>Reset Password?</h2>

        <p>A password reset link will be sent to the user for reset the password.</p>

        <Button onClick={onSuccess}>Reset Now</Button>
      </Reset>
    </Box>
  );
}
