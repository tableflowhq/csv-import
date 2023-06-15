import { Table } from "@tableflowhq/ui-library";
import UppyWrapper from "../../components/UppyWrapper";
import useTemplateTable from "./hooks/useTemplateTable";
import { UploaderProps } from "./types";
import style from "./style/Uploader.module.scss";

export default function Uploader({ template, onSuccess }: UploaderProps) {
  const fields = useTemplateTable(template.template_columns);

  const onFileUpload = (result: any) => {
    // Get tusId from the uploadURL
    const tusId = result?.successful?.[0]?.response?.uploadURL?.split("/").pop() || "";
    onSuccess(tusId);
  };

  return (
    <div className={style.content}>
      <UppyWrapper onSuccess={onFileUpload} />
      <Table data={fields} background="dark" columnWidths={["65%", "35%"]} columnAlignments={["", "center"]} />
    </div>
  );
}
