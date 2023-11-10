import Button from "../../../components/Button";
import downloadFile from "../../../api/downloadFile";
import { Import } from "../../../api/types";
import { PiDownload } from "react-icons/pi";

export default function Download({ importItem, apiKey }: { importItem: Import; apiKey: string }) {
  const onClick = () => {
    downloadFile(importItem.id, apiKey, `${importItem.id}.csv`);
  };

  return <Button icon={<PiDownload />} type="button" onClick={onClick} variants={["bare", "square"]} />;
}
