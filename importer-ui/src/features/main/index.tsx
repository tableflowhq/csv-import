import { useEffect, useState } from "react";
import { Button, Errors, Stepper, useStepper } from "@tableflow/ui-library";
import Spinner from "../../components/Spinner";
import { defaultImporterHost, getAPIBaseURL } from "../../api/api";
import useEmbedStore from "../../stores/embed";
import parseCssOverrides, { providedCssOverrides } from "../../utils/cssInterpreter";
import postMessage from "../../utils/postMessage";
import useApi from "./hooks/useApi";
import useModifiedSteps from "./hooks/useModifiedSteps";
import { Steps } from "./types";
import style from "./style/Main.module.scss";
import Complete from "../complete";
import Review from "../review";
import RowSelection from "../row-selection";
import Uploader from "../uploader";

const TUS_ENDPOINT = getAPIBaseURL("v1") + "files";

const steps = [
  { label: "Upload", id: Steps.Upload },
  { label: "Select Header", id: Steps.RowSelection },
  { label: "Review", id: Steps.Review },
  { label: "Complete", id: Steps.Complete },
];

export default function Main() {
  // Get iframe URL params
  const {
    importerId,
    isModal,
    modalIsOpen,
    metadata,
    onComplete,
    showImportLoadingStatus,
    skipHeaderRowSelection,
    template: sdkDefinedTemplate,
    schemaless,
    showDownloadTemplateButton,
    cssOverrides,
  } = useEmbedStore((state) => state.embedParams);
  let skipHeader = skipHeaderRowSelection;

  // Async data & state
  const {
    tusId,
    tusWasStored,
    importerIsLoading,
    importerError,
    template,
    upload,
    uploadError,
    isStored,
    setTusId,
    importer,
    organizationStatus,
    statusIsLoading,
  } = useApi(
    importerId,
    schemaless ? "" : sdkDefinedTemplate, // Don't pass in a template if schemaless is enabled
    window.location.host.indexOf(defaultImporterHost) === 0 && providedCssOverrides(cssOverrides),
    schemaless
  );

  // Apply CSS overrides
  useEffect(() => {
    if (!organizationStatus) {
      return;
    }
    const parsedCss = parseCssOverrides(cssOverrides);
    if (parsedCss) {
      let style = document.getElementById("css-overrides");
      if (!style) {
        style = document.createElement("style");
        style.setAttribute("id", "css-overrides");
        document.head.append(style);
      }
      style.textContent = decodeURIComponent(parsedCss);
    }
  }, [cssOverrides, organizationStatus]);

  // If the skipHeaderRowSelection is not set as a URL param, check the option on the importer
  if (typeof skipHeader === "undefined") {
    skipHeader = importer.skip_header_row_selection;
  }

  const [uploadColumnsRow, setUploadColumnsRow] = useState<any | null>(null);
  const [selectedRow, setSelectedRow] = useState<number>(0);

  const modifiedSteps = useModifiedSteps(steps, skipHeader);

  // Stepper handler
  const stepper = useStepper(modifiedSteps, 0);
  const step = stepper?.step?.id;

  const isEmbeddedInIframe = window?.top !== window?.self;

  useEffect(() => {
    if (uploadError && tusWasStored) reload();
  }, [uploadError]);

  // Delay jump to the second step
  useEffect(() => {
    if (uploadError) stepper.setCurrent(0);

    if (tusId && !uploadError)
      if (upload.header_row_index !== null && upload.header_row_index !== undefined && !skipHeader) {
        setUploadColumnsRow(upload);
        stepper.setCurrent(2);
      } else {
        stepper.setCurrent(1);
      }
  }, [isStored, tusId, uploadError]);

  // Reload on close modal if completed
  useEffect(() => {
    if (!modalIsOpen && step === "complete") reload();
  }, [modalIsOpen]);

  // Actions

  const reload = () => {
    setTusId("");
    stepper.setCurrent(0);
    location.reload();
  };

  const rowSelection = () => {
    stepper.setCurrent(1);
  };

  // Send messages to parent (SDK iframe)

  useEffect(() => {
    if (!isEmbeddedInIframe) return;
    const message = {
      type: "start",
      importerId,
    };
    postMessage(message);
  }, []);

  const requestClose = () => {
    if (!isEmbeddedInIframe || !isModal) return;
    const message = {
      type: "close",
      importerId,
    };
    postMessage(message);
  };

  const handleComplete = (data: any, error: string | null) => {
    if (isEmbeddedInIframe && onComplete) {
      const message = {
        data,
        error,
        type: "complete",
        importerId,
      };
      postMessage(message);
    }
    setTusId("");
  };

  const renderContent = () => {
    if (!isStored && !uploadError && (step === Steps.RowSelection || step === Steps.Review)) {
      return (
        <Spinner className={style.spinner} delay={250}>
          Processing your file...
        </Spinner>
      );
    }
    switch (step) {
      case Steps.Upload:
        return (
          <Uploader
            template={template}
            importerId={importerId}
            metadata={metadata}
            skipHeaderRowSelection={skipHeader || false}
            onSuccess={setTusId}
            endpoint={TUS_ENDPOINT}
            showDownloadTemplateButton={showDownloadTemplateButton}
          />
        );
      case Steps.RowSelection:
        return (
          <RowSelection
            upload={upload}
            onCancel={reload}
            onSuccess={(uploadColumnsRow: any) => {
              stepper.setCurrent(2);
              setUploadColumnsRow(uploadColumnsRow);
            }}
            selectedRow={selectedRow}
            setSelectedRow={setSelectedRow}
          />
        );

      case Steps.Review:
        return (
          <Review
            template={template}
            upload={skipHeader ? upload : uploadColumnsRow}
            onSuccess={() => {
              skipHeader ? stepper.setCurrent(2) : stepper.setCurrent(3);
            }}
            skipHeaderRowSelection={skipHeader}
            onCancel={skipHeader ? reload : rowSelection}
          />
        );
      case Steps.Complete:
        return (
          <Complete
            reload={reload}
            close={requestClose}
            onSuccess={handleComplete}
            upload={upload}
            showImportLoadingStatus={showImportLoadingStatus}
          />
        );
      default:
        return null;
    }
  };

  // Render

  if (importerIsLoading || statusIsLoading) return null;

  if (!importerId)
    return (
      <div className={style.wrapper}>
        <Errors error={"The parameter 'importerId' is required"} />
      </div>
    );

  if (importerError) {
    return (
      <div className={style.wrapper}>
        <Errors error={importerError.toString()} />
      </div>
    );
  }

  return (
    <div className={style.wrapper}>
      <div className={style.header}>
        <Stepper {...stepper} />
      </div>

      <div className={style.content}>{renderContent()}</div>

      {!!uploadError && (
        <div className={style.status}>
          <Errors error={uploadError.toString()} />
          <Button onClick={reload} variants={["primary"]} type="button" icon="update">
            Reload
          </Button>
        </div>
      )}

      {isEmbeddedInIframe && isModal && (
        <Button className={style.close} variants={["square", "secondary", "small"]} onClick={() => requestClose()} icon="cross" />
      )}
    </div>
  );
}
