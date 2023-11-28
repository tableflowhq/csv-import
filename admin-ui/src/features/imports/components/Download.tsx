import Button from "../../../components/Button";
import downloadFile from "../../../api/downloadFile";
import { Import } from "../../../api/types";
import { PiDownloadSimple } from "react-icons/pi";

export default function Download({ importItem, apiKey }: { importItem: Import; apiKey: string }) {
  const onClick = () => {
    downloadFile(importItem.id, apiKey, `${importItem.id}.csv`);
  };

  return <Button icon={<PiDownloadSimple size={18} />} type="button" onClick={onClick} variants={["bare", "square"]} />;
}
