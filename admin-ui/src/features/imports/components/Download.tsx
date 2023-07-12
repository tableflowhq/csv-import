import { Button } from "@tableflow/ui-library";
import downloadFile from "../../../api/downloadFile";
import { Import } from "../../../api/types";

export default function Download({ importItem, apiKey }: { importItem: Import; apiKey: string }) {
  const onClick = () => {
    downloadFile(importItem.id, apiKey, `${importItem.id}.csv`);
  };

  return <Button icon="download" type="button" onClick={onClick} variants={["bare", "square"]} />;
}
