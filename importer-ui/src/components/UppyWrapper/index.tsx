import { useEffect } from "react";
import Uppy from "@uppy/core";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import { Dashboard } from "@uppy/react";
import Tus from "@uppy/tus";
import { getAPIBaseURL } from "../../api/api";
import { ImporterID, Metadata } from "../../features/main";
import "./style/uppy.overrides.scss";
import locale from "./locale";

const TUS_ENDPOINT = getAPIBaseURL("v1") + "files";

const restrictions = {
  allowedFileTypes: ["text/csv"],
};

const uppy = new Uppy({
  restrictions,
  autoProceed: true,
  allowMultipleUploadBatches: false,
  debug: true,
}).use(Tus, {
  endpoint: TUS_ENDPOINT,
  async onBeforeRequest(req): Promise<void> {
    req.setHeader("X-Importer-ID", ImporterID);
    const importMetadataEncoded = Metadata ? btoa(Metadata) : "";
    req.setHeader("X-Import-Metadata", importMetadataEncoded);
  },
  limit: 1,
});

export default function UppyWrapper({ onSuccess }: { onSuccess: (result: any) => void }) {
  useEffect(() => {
    uppy.on("complete", (result) => onSuccess(result));
  }, []);

  return <Dashboard uppy={uppy} proudlyDisplayPoweredByUppy={false} locale={locale} />;
}
