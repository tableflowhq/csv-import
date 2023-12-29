import { useEffect, useState } from "react";
import Uppy, { BasePlugin, PluginOptions } from "@uppy/core";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import { Dashboard } from "@uppy/react";
import { UppyWrapperProps } from "./types";
import "./style/uppy.overrides.scss";
import locale from "./locale";

interface TusOptions extends PluginOptions {
  endpoint?: string;
}

class TusMock extends BasePlugin {
  opts: TusOptions;

  constructor(uppy: Uppy, opts: TusOptions = { endpoint: "default-endpoint" }) {
    super(uppy, opts);
    this.id = "TusMock";
    this.type = "uploader";
    this.opts = {
      endpoint: opts.endpoint || "default-endpoint",
    };
  }

  install() {
    this.uppy.addUploader(this.upload.bind(this));
  }

  uninstall() {
    this.uppy.removeUploader(this.upload.bind(this));
  }

  upload(fileItems: any[]): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (fileItems[0] && fileItems[0].data) {
          const simulatedResponse = {
            id: "61ff2894-83de-4aeb-abf9-5f9b03104d8a",
            tus_id: "c93a4c69b9af66e1fb0065d175461edc",
            importer_id: "5cb74a2f-fc05-4f66-8f23-3aeb4ad9bd00",
            file_name: fileItems[0].name,
            file_type: fileItems[0].type,
            file_extension: "csv",
            file_size: fileItems[0].data.size,
            metadata: {},
            template: null,
            is_stored: true,
            header_row_index: null,
            matched_header_row_index: null,
            sheet_list: null,
            created_at: Date.now(),
            upload_rows: [],
            upload_columns: [],
            response: {
              uploadURL:
                "http://localhost:3003/file-import/v1/files/5f995a72a08b072d496dc3124de2fb35",
            },
          };

          this.uppy.emit("upload-success", fileItems[0], simulatedResponse);
        }
        resolve();
      }, 1000);
    });
  }
}

const uppyOptions = {
  id: "uppy",
  autoProceed: true,
  allowMultipleUploadBatches: false,
  debug: false,
};
const uppyPlaceholder = new Uppy(uppyOptions);

export default function UppyWrapper({ onSuccess, ...props }: UppyWrapperProps) {
  const [uppy, setUppy] = useState<Uppy | null>(null);

  useEffect(() => {
    const initializeUppy = () => {
      const instance = new Uppy(uppyOptions);
      instance.use(TusMock, { endpoint: "mock-endpoint" });

      instance.on("complete", (result) => {
        setTimeout(() => {
          const [successFul] = result.successful;
          const addedResponse = [{...successFul ,response: {
            uploadURL:
              "http://localhost:3003/file-import/v1/files/5f995a72a08b072d496dc3124de2fb35",
          } }]
          const newResult = {...result, successful: addedResponse}
          onSuccess(newResult as any);
          // Close Uppy instance to reset its state
          instance.close({ reason: "unmount" });
          // Re-initialize a fresh Uppy instance so if the user navigates back, the state is reset
          initializeUppy();
        }, 350);
        instance.close();
      });

      setUppy(instance);
      return () => instance.close();
    };

    const uppyInstance = initializeUppy();

    // return () => {
    //     uppyInstance?.close();
    // };
  }, [onSuccess]);

  return (
    <Dashboard
      uppy={uppy ? uppy : uppyPlaceholder}
      proudlyDisplayPoweredByUppy={false}
      locale={locale}
    />
  );
}
