import { Table } from "@tableflow/ui-library";
import UppyWrapper from "../../components/UppyWrapper";
import useTemplateTable from "./hooks/useTemplateTable";
import { UploaderProps } from "./types";
import style from "./style/Uploader.module.scss";

export default function Uploader({ template, importerId, metadata, skipHeaderRowSelection, endpoint, onSuccess }: UploaderProps) {
  const fields = useTemplateTable(template.columns);

  const onFileUpload = (result: any) => {
    // Get tusId from the uploadURL
    const tusId = result?.successful?.[0]?.response?.uploadURL?.split("/").pop() || "";
    onSuccess(tusId);
  };

  let templateOverride;
  if (template.is_override) {
    templateOverride = template;
  }

  return (
    <div className={style.content}>
      <UppyWrapper
        onSuccess={onFileUpload}
        importerId={importerId}
        metadata={metadata}
        skipHeaderRowSelection={skipHeaderRowSelection}
        endpoint={endpoint}
        template={templateOverride}
      />
      <Table data={fields} background="dark" columnWidths={["65%", "35%"]} columnAlignments={["", "center"]} />
    </div>
  );
}
