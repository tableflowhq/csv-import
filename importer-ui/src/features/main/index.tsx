import { useEffect, useState } from "react";
import { Button, Errors, Stepper, useStepper } from "@tableflow/ui-library";
import Spinner from "../../components/Spinner";
import { getAPIBaseURL } from "../../api/api";
import useEmbedStore from "../../stores/embed";
import postMessage from "../../utils/postMessage";
import useApi from "./hooks/useApi";
import style from "./style/Main.module.scss";
import Complete from "../complete";
import Review from "../review";
import RowSelection from "../row-selection";
import Uploader from "../uploader";

const TUS_ENDPOINT = getAPIBaseURL("v1") + "files";

const steps = [
  { label: "Upload", id: "upload" },
  { label: "Select Header", id: "row-selection" },
  { label: "Review", id: "review" },
  { label: "Complete", id: "complete" },
];

export default function Main() {
  // Get iframe URL params
  const {
    importerId,
    metadata,
    isOpen,
    onComplete,
    showImportLoadingStatus,
    skipHeaderRowSelection,
    template: sdkDefinedTemplate,
    schemaless,
  } = useEmbedStore((state) => state.embedParams);
  let skipHeader = skipHeaderRowSelection;

  // Async data & state
  const { tusId, tusWasStored, importerIsLoading, importerError, template, upload, uploadError, isStored, setTusId, importer } = useApi(
    importerId,
    schemaless ? "" : sdkDefinedTemplate, // Don't pass in a template if schemaless is enabled
    schemaless
  );

  // If the skipHeaderRowSelection is not set as a URL param, check the option on the importer
  if (typeof skipHeader === "undefined") {
    skipHeader = importer.skip_header_row_selection;
  }

  const [uploadColumnsRow, setUploadColumnsRow] = useState<any | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const modifiedSteps = skipHeader ? steps.filter((step) => step.id !== "row-selection") : steps;

  // Stepper handler
  const stepper = useStepper(modifiedSteps, 0);
  const step = stepper?.step?.id;

  useEffect(() => {
    if (uploadError && tusWasStored) reload();
  }, [uploadError]);

  // Delay jump to the second step
  useEffect(() => {
    if (tusId)
      setTimeout(() => {
        if (upload.header_row_index !== null && upload.header_row_index !== undefined && !skipHeader) {
          setUploadColumnsRow(upload);
          stepper.setCurrent(2);
        } else {
          stepper.setCurrent(1);
        }
      }, 250);
  }, [isStored, tusId]);

  // Reload on close modal if completed
  useEffect(() => {
    if (!isOpen && step === "complete") reload();
  }, [isOpen]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedId("0");
    }
  }, []);

  // Success

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
    const message = {
      type: "start",
      importerId,
    };
    postMessage(message);
  }, []);

  const requestClose = () => {
    const message = {
      type: "close",
      importerId,
    };
    postMessage(message);
  };

  const handleComplete = (data: any, error: string | null) => {
    if (onComplete) {
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

  // Render

  if (importerIsLoading) return null;

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

  const content =
    step === "upload" || !!uploadError ? (
      <Uploader
        template={template}
        importerId={importerId}
        metadata={metadata}
        skipHeaderRowSelection={skipHeader}
        onSuccess={setTusId}
        endpoint={TUS_ENDPOINT}
        schemaless={schemaless}
      />
    ) : step === (skipHeader ? "review" : "row-selection") && !isStored ? (
      <Spinner className={style.spinner}>Processing your file...</Spinner>
    ) : step === "row-selection" && !!isStored ? (
      <RowSelection
        upload={upload}
        onCancel={reload}
        onSuccess={(uploadColumnsRow: any) => {
          stepper.setCurrent(2);
          setUploadColumnsRow(uploadColumnsRow);
        }}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
      />
    ) : step === "review" && !!isStored ? (
      <Review
        template={template}
        upload={skipHeader ? upload : uploadColumnsRow}
        onSuccess={() => {
          skipHeader ? stepper.setCurrent(2) : stepper.setCurrent(3);
        }}
        skipHeaderRowSelection={skipHeader}
        onCancel={skipHeader ? reload : rowSelection}
        schemaless={schemaless}
      />
    ) : !uploadError && step === "complete" ? (
      <Complete reload={reload} close={requestClose} onSuccess={handleComplete} upload={upload} showImportLoadingStatus={showImportLoadingStatus} />
    ) : null;

  const isEmbeddedInIframe = window?.top !== window?.self;

  return (
    <div className={style.wrapper}>
      <div className={style.header}>
        <Stepper {...stepper} />
      </div>

      <div className={style.content}>{content}</div>

      {!!uploadError && (
        <div className={style.status}>
          <Errors error={uploadError.toString()} />
          <Button onClick={reload} variants={["primary"]} type="button" icon="update">
            Reload
          </Button>
        </div>
      )}

      {isEmbeddedInIframe && (
        <Button className={style.close} variants={["square", "secondary", "small"]} onClick={() => requestClose()} icon="cross" />
      )}
    </div>
  );
}
