import { useEffect } from "react";
import { Button, Errors, Stepper, useStepper } from "@tableflow/ui-library";
import Spinner from "../../components/Spinner";
import { getAPIBaseURL } from "../../api/api";
import useEmbedStore from "../../stores/embed";
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
  const { importerId, metadata, isOpen, onComplete } = useEmbedStore((state) => state.embedParams);

  // Stepper handler
  const stepper = useStepper(steps, 0);
  const step = stepper?.step?.id;

  // Async data & state
  const { tusId, tusWasStored, importerIsLoading, importerError, template, upload, uploadError, isParsed, setTusId } = useApi(importerId);

  useEffect(() => {
    if (uploadError && tusWasStored) reload();
  }, [uploadError]);

  // Delay jump to the second step
  useEffect(() => {
    if (tusId) setTimeout(() => stepper.setCurrent(1), 500);
  }, [isParsed, tusId]);

  // Remove stored tusId on complete
  useEffect(() => {
    if (step === "complete") setTusId("");
  }, [step]);

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
    window?.top?.postMessage("close", "*") || window?.parent?.postMessage("close", "*");
  };

  const handleComplete = (data: any, error: string) => {
    setTusId("");

    if (onComplete) {
      const message = JSON.stringify({
        data,
        error,
        type: "complete",
      });
      window?.top?.postMessage(message, "*") || window?.parent?.postMessage(message, "*");
    }
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

  console.log(isParsed, step);

  const content =
    step === "upload" || !!uploadError ? (
      <Uploader template={template} importerId={importerId} metadata={metadata} onSuccess={setTusId} endpoint={TUS_ENDPOINT} />
    ) : step === "review" && !isParsed ? (
      <Spinner className={style.spinner}>Processing your file...</Spinner>
    ) : step === "review" && !!isParsed ? (
      <Review template={template} upload={upload} onSuccess={() => stepper.setCurrent(2)} onCancel={reload} />
    ) : !uploadError && step === "complete" ? (
      <Complete reload={reload} close={requestClose} onSuccess={handleComplete} />
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
