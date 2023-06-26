import { useEffect } from "react";
import Uppy from "@uppy/core";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import { Dashboard } from "@uppy/react";
import Tus from "@uppy/tus";
import { UppyWrapperProps } from "./types";
import "./style/uppy.overrides.scss";
import locale from "./locale";

const restrictions = {
  allowedFileTypes: ["text/csv"],
};

const uppy = new Uppy({
  id: "uppy",
  restrictions,
  autoProceed: true,
  allowMultipleUploadBatches: false,
  debug: true,
}).use(Tus, { limit: 1 });

export default function UppyWrapper({ onSuccess, importerId = "", metadata = "", endpoint = "" }: UppyWrapperProps) {
  useEffect(() => {
    const tusInstance = uppy?.getPlugin("Tus");
    tusInstance?.setOptions({
      endpoint,
      onBeforeRequest: (req: any) => {
        req.setHeader("X-Importer-ID", importerId);
        const importMetadataEncoded = metadata ? btoa(metadata) : "";
        req.setHeader("X-Import-Metadata", importMetadataEncoded);
      },
    });
  }, [importerId, metadata, endpoint]);

  useEffect(() => {
    uppy.on("complete", (result) => onSuccess(result as any));
  }, [importerId, metadata]);

  return <Dashboard uppy={uppy} proudlyDisplayPoweredByUppy={false} locale={locale} />;
}
