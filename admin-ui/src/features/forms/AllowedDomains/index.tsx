import Box from "../../../components/Box";
import ListManager from "../../../components/ListManager";
import { Workspace } from "../../../api/types";
import usePostWorkspace from "../../../api/usePostWorkspace";
import classes from "../../../utils/classes";
import style from "../style/Form.module.scss";
import { PiLink } from "react-icons/pi";

export default function Domains({ workspace }: { workspace?: Workspace }) {
  const { mutate, isLoading, error } = usePostWorkspace(workspace?.id);

  return (
    <div>
      <div className={style.header}>
        <div className={classes([style.title, style.smallInnerSpace])}>
          <h3>Allowed Domains</h3>
          <small>
            Add domains to restrict where your importers can be embedded. If no domains are added, your importers will work on any website.
          </small>
        </div>
      </div>
      <Box variants={["bg-shade"]}>
        <ListManager
          placeholder="example.com"
          name="Allowed domains"
          icon={<PiLink />}
          required
          formStyle={style.form}
          onChange={(values: string[]) => {
            mutate({ id: workspace?.id, allowed_import_domains: values });
          }}
          disabled={isLoading}
          value={workspace?.allowed_import_domains}
          buttonText={"+ Add Domain"}
        />
      </Box>
    </div>
  );
}
