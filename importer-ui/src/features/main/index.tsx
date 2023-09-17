import { useEffect, useState } from "react";
import { Button, Errors, Stepper, useStepper } from "@tableflow/ui-library";
import Spinner from "../../components/Spinner";
import { defaultImporterHost, getAPIBaseURL } from "../../api/api";
import useCssOverrides from "../../hooks/useCssOverrides";
import useDelayedLoader from "../../hooks/useDelayLoader";
import useEmbedStore from "../../stores/embed";
import { providedCssOverrides } from "../../utils/cssInterpreter";
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

const stepsConfig = [
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

  // Async data & state
  const {
    tusId,
    setTusId,
    tusWasStored,
    importer,
    importerIsLoading,
    importerError,
    organizationStatus,
    statusIsLoading,
    template,
    upload,
    uploadIsLoading,
    uploadError,
    uploadIsStored,
  } = useApi(
    importerId,
    schemaless ? "" : sdkDefinedTemplate, // Don't pass in a template if schemaless is enabled
    window.location.host.indexOf(defaultImporterHost) === 0 && providedCssOverrides(cssOverrides),
    schemaless
  );

  const isEmbeddedInIframe = window?.top !== window?.self;

  // Apply CSS overrides
  useCssOverrides(cssOverrides, organizationStatus);

  // If the skipHeaderRowSelection is not set as a URL param, check the option on the importer
  const skipHeader = skipHeaderRowSelection != null ? !!skipHeaderRowSelection : importer.skip_header_row_selection;

  // Header row selection state
  const [selectedHeaderRow, setSelectedHeaderRow] = useState<number>(0);
  const [uploadFromHeaderRowSelection, setUploadFromHeaderRowSelection] = useState<any | null>(null);

  // Stepper handler
  const steps = useModifiedSteps(stepsConfig, skipHeader);
  const stepper = useStepper(steps, 0);
  const step = stepper?.step?.id;

  // There was an error the last time they tried to upload a file. Reload to clear stored tusId
  // TODO: This doesn't work, fix it
  // useEffect(() => {
  //   if (uploadError && tusWasStored) reload();
  // }, [uploadError]);

  // Handle initial page loads using a small delay so the screen doesn't flash when loading different states
  const [initialPageLoaded, setInitialPageLoaded] = useState<boolean>(false);
  useEffect(() => {
    setTimeout(() => {
      setInitialPageLoaded(!importerIsLoading && !statusIsLoading && !uploadIsLoading);
    }, 50);
  }, [importerIsLoading, statusIsLoading, uploadIsLoading]);

  // Handle the upload loading indicator
  const [showUploadSpinner, setShowUploadSpinner] = useState<boolean>(false);
  const displayUploadSpinner = useDelayedLoader(showUploadSpinner, 250);

  useEffect(() => {
    const isUploadLoading = tusId && !uploadError && !uploadIsStored;
    setShowUploadSpinner(isUploadLoading);
  }, [tusId, uploadIsStored, uploadError, step]);

  // Handle jumping to the right step from page reloads or upload errors
  useEffect(() => {
    // If we're not on the first step, the page wasn't reloaded or an error would have been already handled
    if (step !== Steps.Upload) {
      return;
    }
    const isUploadSuccess = tusId && !uploadError && uploadIsStored;
    const isUploadHeaderRowSet = upload?.header_row_index != null && !skipHeader;

    if (uploadError) {
      stepper.setCurrent(0);
      return;
    }
    if (isUploadSuccess) {
      if (isUploadHeaderRowSet) {
        setUploadFromHeaderRowSelection(upload);
        stepper.setCurrent(2);
      } else {
        stepper.setCurrent(1);
      }
    }
  }, [tusId, uploadIsStored, uploadError, step]);

  // Reload on close modal if completed
  useEffect(() => {
    if (!modalIsOpen && step === Steps.Complete) {
      reload();
    }
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

  // Render

  if (!initialPageLoaded) {
    return null;
  }

  if (!importerId)
    return (
      <div className={style.wrapper}>
        <Errors error={"The parameter 'importerId' is required"} />
      </div>
    );

  if (importerError)
    return (
      <div className={style.wrapper}>
        <Errors error={importerError.toString()} />
      </div>
    );

  const renderContent = () => {
    if (displayUploadSpinner) {
      return <Spinner className={style.spinner}>Processing your file...</Spinner>;
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
            schemaless={schemaless}
          />
        );
      case Steps.RowSelection:
        return (
          <RowSelection
            upload={upload}
            onCancel={reload}
            onSuccess={(upload: any) => {
              stepper.setCurrent(2);
              setUploadFromHeaderRowSelection(upload);
            }}
            selectedHeaderRow={selectedHeaderRow}
            setSelectedHeaderRow={setSelectedHeaderRow}
          />
        );
      case Steps.Review:
        return (
          <Review
            template={template}
            upload={skipHeader ? upload : uploadFromHeaderRowSelection}
            onSuccess={() => {
              skipHeader ? stepper.setCurrent(2) : stepper.setCurrent(3);
            }}
            skipHeaderRowSelection={skipHeader}
            onCancel={skipHeader ? reload : rowSelection}
            schemaless={schemaless}
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
