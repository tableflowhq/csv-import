import { useEffect, useState } from "react";
import { Button, IconButton } from "@chakra-ui/button";
import Errors from "../../components/Errors";
import Stepper from "../../components/Stepper";
import useStepper from "../../components/Stepper/hooks/useStepper";
import TableLoading from "../../components/TableLoading";
import { defaultImporterHost, getAPIBaseURL } from "../../api/api";
import useCssOverrides from "../../hooks/useCssOverrides";
import useCustomStyles from "../../hooks/useCustomStyles";
import useDelayedLoader from "../../hooks/useDelayLoader";
import useRevealApp from "../../hooks/useRevealApp";
import useEmbedStore from "../../stores/embed";
import classes from "../../utils/classes";
import { providedJSONString } from "../../utils/cssInterpreter";
import postMessage from "../../utils/postMessage";
import { ColumnsOrder } from "../review/types";
import useApi from "./hooks/useApi";
import useModifiedSteps from "./hooks/useModifiedSteps";
import { Steps } from "./types";
import style from "./style/Main.module.scss";
import MapColumns from "../map-columns";
import Review from "../review";
import RowSelection from "../row-selection";
import Uploader from "../uploader";
import { PiArrowsClockwise, PiX } from "react-icons/pi";

const TUS_ENDPOINT = getAPIBaseURL("v1") + "files";

const stepsConfig = [
  { label: "Upload", id: Steps.Upload },
  { label: "Select Header", id: Steps.RowSelection },
  { label: "Map Columns", id: Steps.MapColumns },
  { label: "Review", id: Steps.Review },
];

export default function Main() {
  useRevealApp();

  // Get iframe URL params
  const {
    importerId,
    isModal,
    modalIsOpen,
    metadata,
    onComplete,
    waitOnComplete,
    showImportLoadingStatus,
    skipHeaderRowSelection,
    template: sdkDefinedTemplate,
    schemaless,
    schemalessReadOnly,
    showDownloadTemplateButton,
    customStyles,
    cssOverrides,
  } = useEmbedStore((state) => state.embedParams);

  // Async data & state
  const {
    tusId,
    setTusId,
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
    review,
    reviewIsLoading,
    reviewIsStored,
    enabledReview,
    setEnabledReview,
  } = useApi(
    importerId,
    schemaless ? "" : sdkDefinedTemplate, // Don't pass in a template if schemaless is enabled
    providedJSONString(customStyles) || providedJSONString(cssOverrides),
    // window.location.host.indexOf(defaultImporterHost) === 0 && (providedJSONString(customStyles) || providedJSONString(cssOverrides)),
    schemaless
  );

  const isDevelopment = false; // window.location.hostname === "localhost";
  const isEmbeddedInIframe = window?.top !== window?.self;
  const [columnsValues, seColumnsValues] = useState({});

  // Apply custom styles
  useCustomStyles(customStyles, isDevelopment ? true : organizationStatus && organizationStatus["feature-custom-styles"]);

  // Apply CSS overrides
  useCssOverrides(cssOverrides, isDevelopment ? true : organizationStatus && organizationStatus["feature-css-overrides"]);

  // If the skipHeaderRowSelection is not set as a URL param, check the option on the importer
  const skipHeader = skipHeaderRowSelection != null ? !!skipHeaderRowSelection : importer.skip_header_row_selection;

  // Header row selection state
  const [selectedHeaderRow, setSelectedHeaderRow] = useState<number>(0);
  const [uploadFromHeaderRowSelection, setUploadFromHeaderRowSelection] = useState<any | null>(null);
  const [columnsOrder, setColumnsOrder] = useState<ColumnsOrder>();

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
    const interval = setTimeout(() => {
      setInitialPageLoaded(!importerIsLoading && !statusIsLoading && !uploadIsLoading);
    }, 250);
    return () => clearInterval(interval);
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

  useEffect(() => {
    if (review && !reviewIsLoading && reviewIsStored && enabledReview) {
      if (skipHeader) stepper.setCurrent(2);
      else stepper.setCurrent(3);
    }
  }, [review, reviewIsLoading, reviewIsStored, skipHeader, enabledReview]);

  // Reload on close modal if completed
  useEffect(() => {
    // TODO: ****************************** Update this to actually check if completed ********************************
    // if (!modalIsOpen && step === Steps.Review) {
    //   reload();
    // }
  }, [modalIsOpen]);

  // Actions

  const reload = () => {
    setTusId("");
    stepper.setCurrent(0);
    location.reload();
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
    // TODO: If waitOnComplete and in the last stage of the import, should we setTusId("") to reset the importer here?
  };

  const handleComplete = (data: any) => {
    if (isEmbeddedInIframe && onComplete) {
      const message = {
        data,
        type: "complete",
        importerId,
      };
      postMessage(message);
    }
    setTusId("");
  };

  const handleCancelReview = () => {
    if (skipHeader) {
      stepper.setCurrent(1);
    } else {
      stepper.setCurrent(2);
    }
  };

  if (!initialPageLoaded) {
    return (
      <div className={style.wrapper}>
        <div className={style.content}>
          <TableLoading hideBorder />
        </div>
      </div>
    );
  }

  if (!importerId) {
    return (
      <div className={isEmbeddedInIframe ? style.wrapper : classes([style.wrapper, style.wrapperLink])}>
        <Errors error={"The parameter 'importerId' is required"} centered />
      </div>
    );
  }

  if (importerError) {
    return (
      <div className={isEmbeddedInIframe ? style.wrapper : classes([style.wrapper, style.wrapperLink])}>
        <Errors error={importerError.toString()} centered />
      </div>
    );
  }

  const renderContent = () => {
    if (displayUploadSpinner) {
      return <TableLoading hideBorder>Processing your file...</TableLoading>;
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
      case Steps.MapColumns:
        return (
          <MapColumns
            template={template}
            upload={skipHeader ? upload : uploadFromHeaderRowSelection}
            onSuccess={(_, columnsValues) => {
              setEnabledReview(true);
              setColumnsOrder(columnsValues);
            }}
            skipHeaderRowSelection={skipHeader}
            onCancel={skipHeader ? reload : () => stepper.setCurrent(1)}
            schemaless={schemaless}
            schemalessReadOnly={schemalessReadOnly}
            seColumnsValues={seColumnsValues}
            columnsValues={columnsValues}
            isLoading={reviewIsLoading || (!reviewIsStored && enabledReview)}
            onLoad={() => setEnabledReview(false)}
          />
        );
      case Steps.Review:
        return (
          <Review
            template={template}
            onCancel={handleCancelReview}
            close={requestClose}
            onComplete={handleComplete}
            waitOnComplete={waitOnComplete}
            upload={upload}
            reload={reload}
            showImportLoadingStatus={showImportLoadingStatus}
            columnsOrder={columnsOrder}
            review={review}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={isEmbeddedInIframe ? style.wrapper : classes([style.wrapper, style.wrapperLink])}>
      <div className={style.header}>
        <Stepper {...stepper} />
      </div>

      <div className={style.content}>{renderContent()}</div>

      {!!uploadError && (
        <div className={style.status}>
          <div></div>
          <Errors error={uploadError.toString()} centered />
          <Button onClick={reload} colorScheme="primary" leftIcon={<PiArrowsClockwise />}>
            Reload
          </Button>
        </div>
      )}

      {isEmbeddedInIframe && isModal && (
        <IconButton isRound className={style.close} colorScheme="secondary" aria-label="Close" icon={<PiX />} onClick={() => requestClose()} />
      )}
    </div>
  );
}
