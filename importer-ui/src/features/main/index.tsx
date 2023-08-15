import { useEffect } from "react";
import { Button, Errors, Stepper, useStepper } from "@tableflow/ui-library";
import Spinner from "../../components/Spinner";
import { getAPIBaseURL } from "../../api/api";
import useEmbedStore from "../../stores/embed";
import postMessage from "../../utils/postMessage";
import useApi from "./hooks/useApi";
import style from "./style/Main.module.scss";
import Complete from "../complete";
import Review from "../review";
import Uploader from "../uploader";

const TUS_ENDPOINT = getAPIBaseURL("v1") + "files";

const steps = [
  { label: "Upload", id: "upload" },
  { label: "Review", id: "review" },
  { label: "Complete", id: "complete" },
];

export default function Main() {
  // Get iframe URL params
  const { importerId, metadata, isOpen, onComplete, showImportLoadingStatus } = useEmbedStore((state) => state.embedParams);

  // Stepper handler
  const stepper = useStepper(steps, 0);
  const step = stepper?.step?.id;

  // Async data & state
  const { tusId, tusWasStored, importerIsLoading, importerError, template, upload, uploadError, isStored, setTusId } = useApi(importerId);

  useEffect(() => {
    if (uploadError && tusWasStored) reload();
  }, [uploadError]);

  // Delay jump to the second step
  useEffect(() => {
    if (tusId) setTimeout(() => stepper.setCurrent(1), 500);
  }, [isStored, tusId]);

  // Reload on close modal if completed
  useEffect(() => {
    if (!isOpen && step === "complete") reload();
  }, [isOpen]);

  // Success

  // Actions

  const reload = () => {
    setTusId("");
    stepper.setCurrent(0);
    location.reload();
  };

  // Send messages to parent (SDK iframe)

  const requestClose = () => {
    const message = {
      type: "close",
      importerId,
      source: "tableflow-importer",
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
        source: "tableflow-importer",
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
        <Errors error={"importerId is required"} />
      </div>
    );

  if (importerError)
    return (
      <div className={style.wrapper}>
        <Errors error={importerError.toString()} />
      </div>
    );

  const content =
    step === "upload" || !!uploadError ? (
      <Uploader template={template} importerId={importerId} metadata={metadata} onSuccess={setTusId} endpoint={TUS_ENDPOINT} />
    ) : step === "review" && !isStored ? (
      <Spinner className={style.spinner}>Processing your file...</Spinner>
    ) : step === "review" && !!isStored ? (
      <Review template={template} upload={upload} onSuccess={() => stepper.setCurrent(2)} onCancel={reload} />
    ) : !uploadError && step === "complete" ? (
      <Complete reload={reload} close={requestClose} onSuccess={handleComplete} upload={upload} showImportLoadingStatus={showImportLoadingStatus} />
    ) : null;

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
    </div>
  );
}
