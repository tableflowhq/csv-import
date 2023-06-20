import { Button } from "@tableflowhq/ui-library";
import downloadFile from "../../../api/downloadFile";
import { Import } from "../../../api/types";

export default function Download({ importItem, apiKey }: { importItem: Import; apiKey: string }) {
  const onClick = () => {
    downloadFile(importItem.id, apiKey, `${importItem.id}.${importItem.file_extension}`);
  };

  return <Button icon="arrowDown" type="button" onClick={onClick} variants={["bare"]} />;
}
