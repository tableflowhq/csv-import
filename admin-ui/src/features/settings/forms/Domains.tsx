import { useEffect, useState } from "react";
import { Errors } from "@tableflowhq/ui-library";
import ListManager from "../../../components/ListManager";
import { Importer } from "../../../api/types";
import usePostImporter from "../../../api/usePostImporter";
import style from "../style/Form.module.scss";

export default function Domains({ importer }: { importer: Importer }) {
  const [allowed_domains, setAllowedDomains] = useState<string[]>(importer.allowed_domains || []);

  const { mutate, isLoading, error } = usePostImporter(importer.id);

  useEffect(() => {
    mutate({ id: importer.id, allowed_domains });
  }, [allowed_domains]);

  return (
    <>
      <ListManager
        placeholder="https://"
        name="Allowed domains"
        icon="gear"
        required
        formStyle={style.form}
        onChange={(value: string[]) => setAllowedDomains(value)}
        disabled={isLoading}
        value={allowed_domains}
      />

      {error && <Errors error={error} />}
    </>
  );
}
