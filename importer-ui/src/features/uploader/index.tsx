import { Button } from "@chakra-ui/button";
import Table from "../../components/Table";
import UppyWrapper from "../../components/UppyWrapper";
import useThemeStore from "../../stores/theme";
import useTemplateTable from "./hooks/useTemplateTable";
import { UploaderProps } from "./types";
import style from "./style/Uploader.module.scss";
import { PiDownload } from "react-icons/pi";

export default function Uploader({
  template,
  importerId,
  metadata,
  skipHeaderRowSelection,
  endpoint,
  onSuccess,
  schemaless,
  showDownloadTemplateButton,
}: UploaderProps) {
  const fields = useTemplateTable(template.columns);

  const theme = useThemeStore((state) => state.theme);

  const onFileUpload = (result: any) => {
    // Get tusId from the uploadURL
    const tusId = result?.successful?.[0]?.response?.uploadURL?.split("/").pop() || "";
    onSuccess(tusId);
  };

  let sdkDefinedTemplate;
  if (template.is_sdk_defined) {
    // Only pass in the template to the UppyWrapper if it is defined from the SDK, as this is the only time we need to
    // persist the template with the upload
    sdkDefinedTemplate = template;
  }

  const uppyWrapper = (
    <UppyWrapper
      onSuccess={onFileUpload}
      importerId={importerId}
      metadata={metadata}
      skipHeaderRowSelection={skipHeaderRowSelection}
      endpoint={endpoint}
      sdkDefinedTemplate={sdkDefinedTemplate}
      schemaless={schemaless}
    />
  );
  if (schemaless) {
    return <div className={style.content}>{uppyWrapper}</div>;
  }

  function downloadTemplate() {
    const { columns } = template;
    const csvData = `${columns.map((obj) => obj.name).join(",")}`;

    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csvData], { type: "text/csv" }));
    link.download = "example.csv";
    link.click();
  }

  const downloadTemplateButton = showDownloadTemplateButton ? (
    <Button
      width="100%"
      leftIcon={<PiDownload />}
      onClick={downloadTemplate}
      colorScheme={"secondary"}
      variant={theme === "light" ? "outline" : "solid"}>
      Download Template
    </Button>
  ) : null;

  return (
    <div className={style.content}>
      {uppyWrapper}
      <div className={style.box}>
        <div className={style.tableContainer}>
          <Table fixHeader data={fields} background="dark" columnWidths={["65%", "35%"]} columnAlignments={["", "center"]} />
        </div>
        {downloadTemplateButton}
      </div>
    </div>
  );
}
