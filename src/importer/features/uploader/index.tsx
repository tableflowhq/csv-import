import { useTranslation } from "react-i18next";
import { Button } from "@chakra-ui/button";
import Table from "../../components/Table";
import UploaderWrapper from "../../components/UploaderWrapper/UploaderWrapper";
import useThemeStore from "../../stores/theme";
import useTemplateTable from "./hooks/useTemplateTable";
import { UploaderProps } from "./types";
import style from "./style/Uploader.module.scss";
import { PiDownloadSimple } from "react-icons/pi";


export default function Uploader({ template, skipHeaderRowSelection, onSuccess, showDownloadTemplateButton, setDataError }: UploaderProps) {
  const fields = useTemplateTable(template.columns);
  const theme = useThemeStore((state) => state.theme);
  const uploaderWrapper = <UploaderWrapper onSuccess={onSuccess} skipHeaderRowSelection={skipHeaderRowSelection} setDataError={setDataError} />;
  showDownloadTemplateButton = showDownloadTemplateButton ?? true;
  const { t } = useTranslation();

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
      leftIcon={<PiDownloadSimple />}
      onClick={downloadTemplate}
      colorScheme={"secondary"}
      variant={theme === "light" ? "outline" : "solid"}
      _hover={
        theme === "light"
          ? {
              background: "var(--color-border)",
              color: "var(--color-text)",
            }
          : undefined
      }>
      {t("Download Template")}
    </Button>
  ) : null;

  return (
    <div className={style.content}>
      {uploaderWrapper}
      <div className={style.box}>
        <div className={style.tableContainer}>
          <Table fixHeader data={fields} background="transparent" columnWidths={["65%", "35%"]} columnAlignments={["", "center"]} />
        </div>
        {downloadTemplateButton}
      </div>
    </div>
  );
}