import { useEffect, useState } from "react";
import Uppy from "@uppy/core";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import { Dashboard } from "@uppy/react";
import Tus from "@uppy/tus";
import { UppyWrapperProps } from "./types";
import "./style/uppy.overrides.scss";
import locale from "./locale";

const restrictions = {
  allowedFileTypes: ["text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  maxNumberOfFiles: 1,
  maxFileSize: 1073741824, // 1GB
};

const options = {
  id: "uppy",
  restrictions,
  autoProceed: true,
  allowMultipleUploadBatches: false,
  debug: false,
};

const uppyPlaceholder = new Uppy(options);

export default function UppyWrapper({
  onSuccess,
  importerId = "",
  metadata = "",
  skipHeaderRowSelection = false,
  endpoint = "",
  sdkDefinedTemplate,
  schemaless,
}: UppyWrapperProps) {
  const [uppy, setUppy] = useState<Uppy | null>(null);

  useEffect(() => {
    const initializeUppy = () => {
      const instance = new Uppy(options).use(Tus, { limit: 1 });

      const tusInstance = instance?.getPlugin("Tus");
      tusInstance?.setOptions({
        endpoint,
        onBeforeRequest: (req: any) => {
          req.setHeader("X-Importer-ID", importerId);
          const importMetadataEncoded = metadata ? btoa(metadata) : "";
          req.setHeader("X-Import-Metadata", importMetadataEncoded);
          req.setHeader("X-Import-SkipHeaderRowSelection", String(skipHeaderRowSelection));
          if (sdkDefinedTemplate) {
            const templateJSON = JSON.stringify(sdkDefinedTemplate);
            req.setHeader("X-Import-Template", btoa(templateJSON));
          }
          if (schemaless) {
            req.setHeader("X-Import-Schemaless", String(schemaless));
          }
        },
      });
      instance?.on("complete", (result) => {
        setTimeout(() => {
          onSuccess(result as any);
          // Close Uppy instance to reset its state
          instance.close({ reason: "unmount" });
          // Re-initialize a fresh Uppy instance so if the user navigates back, the state is reset
          initializeUppy();
        }, 350);
      });
      setUppy(instance);
    };

    initializeUppy();
  }, [importerId, metadata, endpoint, sdkDefinedTemplate]);

  return <Dashboard uppy={uppy ? uppy : uppyPlaceholder} proudlyDisplayPoweredByUppy={false} locale={locale} />;
}
