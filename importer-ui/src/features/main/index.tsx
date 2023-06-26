import { useEffect } from "react";
import { Button, Errors, Stepper, useLocalStorage, useStepper } from "@tableflowhq/ui-library";
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
  const { importerId, metadata, isOpen } = useEmbedStore((state) => state.embedParams);

  const [stepStore, setStepStore] = useLocalStorage("stepStored", "upload");
  const stepper = useStepper(
    steps,
    steps.reduce((_, step, i) => (step.id === stepStore ? i : 0), 0) // default value is index of step from local storage
  );
  const step = stepper?.step?.id;

  const { isLoadingImporter, importerError, template, upload, uploadError, isParsed, setTusId } = useApi(importerId);

  useEffect(() => {
    setStepStore(step);
  }, [step]);

  // Reload on close + complete
  useEffect(() => {
    if (!isOpen && step === "complete") {
      reload();
    }
  }, [isOpen]);

  // Delay jump to the second step
  useEffect(() => {
    if (isParsed) setTimeout(() => stepper.setCurrent(1), 1000);
  }, [isParsed]);

  // Actions
  const requestClose = () => {
    window?.top?.postMessage("close", "*");
    window?.parent?.postMessage("close", "*");
  };

  const reload = () => {
    setTusId("");
    stepper.setCurrent(0);
    location.reload();
  };

  // Render

  if (isLoadingImporter) return null;

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

  return (
    <div className={style.wrapper}>
      <div className={style.header}>
        <Stepper {...stepper} />
      </div>

      <div className={style.content}>
        {step === "upload" && (
          <Uploader template={template} importerId={importerId} metadata={metadata} onSuccess={setTusId} endpoint={TUS_ENDPOINT} />
        )}
        {step === "review" && <Review template={template} upload={upload} onSuccess={() => stepper.setCurrent(2)} onCancel={reload} />}
        {step === "complete" && <Complete reload={reload} close={requestClose} />}
        {step === "done" && <div>All done</div>}
      </div>

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
