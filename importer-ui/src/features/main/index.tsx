import { useEffect, useState } from "react";
import { Errors, Stepper, useStepper } from "@tableflowhq/ui-library";
import { Importer, Template, Upload } from "../../api/types";
import useGetImporter from "../../api/useGetImporter";
import useGetUpload from "../../api/useGetUpload";
import useEmbedStore from "../../stores/embed";
import style from "./style/Main.module.scss";
import Complete from "../complete";
import Review from "../review";
import Uploader from "../uploader";

const steps = [
  { label: "Upload", id: "upload" },
  { label: "Review", id: "review" },
  { label: "Complete", id: "complete" },
];

export let ImporterID = "";
export let Metadata = "";

export default function Main() {
  const { importerId, metadata } = useEmbedStore((state) => state.embedParams);
  ImporterID = importerId;
  Metadata = metadata;

  const stepper = useStepper(steps, 0);
  const step = stepper?.step?.id || "done";

  const [tusId, setTusId] = useState("");

  // Load importer & template for the first step
  const { data: importer = {} as Importer, isLoading, error } = useGetImporter(importerId);
  const { template = {} as Template } = importer;

  // Load upload for the second step
  const { data: upload = {} as Upload, error: uploadError } = useGetUpload(tusId);
  const { is_parsed } = upload;

  // Delay jump to the second step
  useEffect(() => {
    if (is_parsed) setTimeout(() => stepper.setCurrent(1), 1000);
  }, [is_parsed]);

  if (!importerId)
    return (
      <div className={style.wrapper}>
        <Errors error={"importerId is required"} />
      </div>
    );

  if (isLoading) return null;

  if (error)
    return (
      <div className={style.wrapper}>
        <Errors error={error.toString()} />
      </div>
    );

  return (
    <div className={style.wrapper}>
      <div className={style.header}>
        <Stepper {...stepper} />
      </div>

      <div className={style.content}>
        {step === "upload" && <Uploader template={template} onSuccess={setTusId} />}
        {step === "review" && (
          <Review
            template={template}
            upload={upload}
            onSuccess={() => stepper.setCurrent(2)}
            onCancel={() => {
              stepper.setCurrent(0);
              setTusId("");
            }}
          />
        )}
        {step === "complete" && <Complete />}
        {step === "done" && <div>All done</div>}
      </div>

      {!!uploadError && <Errors error={uploadError.toString()} />}
    </div>
  );
}
