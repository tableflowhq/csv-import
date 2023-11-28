import { useEffect, useState } from "react";
import { Button, IconButton } from "@chakra-ui/button";
import Errors from "../../components/Errors";
import Stepper from "../../components/Stepper";
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
import useStepNavigation, { StepEnum } from "./hooks/useStepNavigation";
import style from "./style/Main.module.scss";
import MapColumns from "../map-columns";
import Review from "../review";
import RowSelection from "../row-selection";
import Uploader from "../uploader";
import { PiArrowCounterClockwise, PiX } from "react-icons/pi";

const TUS_ENDPOINT = getAPIBaseURL("v1") + "files";

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
    window.location.host.indexOf(defaultImporterHost) === 0 && (providedJSONString(customStyles) || providedJSONString(cssOverrides)),
    schemaless
  );

  const isDevelopment = window.location.hostname === "localhost";
  const isEmbeddedInIframe = window?.top !== window?.self;
  const [columnsValues, seColumnsValues] = useState({});

  // Apply custom styles
  useCustomStyles(customStyles, isDevelopment ? true : organizationStatus && organizationStatus["feature-custom-styles"]);

  // Apply CSS overrides
  useCssOverrides(cssOverrides, isDevelopment ? true : organizationStatus && organizationStatus["feature-css-overrides"]);

  // If the skipHeaderRowSelection is not set as a URL param, check the option on the importer
  const skipHeader = skipHeaderRowSelection != null ? !!skipHeaderRowSelection : importer.skip_header_row_selection;

  // Header row selection state
  const [selectedHeaderRow, setSelectedHeaderRow] = useState<number | null>(null);
  const [uploadFromHeaderRowSelection, setUploadFromHeaderRowSelection] = useState<any | null>(null);
  const [columnsOrder, setColumnsOrder] = useState<ColumnsOrder>();

  // Stepper handler
  const { currentStep, setStep, goNext, goBack, stepper } = useStepNavigation(StepEnum.Upload, skipHeader, importerId, tusId);

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
  }, [tusId, uploadIsStored, uploadError, currentStep]);

  // Handle jumping to the right step from page reloads or upload errors
  useEffect(() => {
    // If we're not on the first step, the page wasn't reloaded or an error would have been already handled
    if (currentStep !== StepEnum.Upload) {
      return;
    }
    const isUploadSuccess = tusId && !uploadError && uploadIsStored;
    if (uploadError) {
      setStep(StepEnum.Upload);
      return;
    }

    if (isUploadSuccess) {
      if (currentStep === StepEnum.MapColumns) {
        setUploadFromHeaderRowSelection(upload);
        setSelectedHeaderRow(upload?.header_row_index);
        setStep(currentStep);
      } else {
        goNext();
      }
    }
  }, [tusId, uploadIsStored, uploadError, currentStep]);

  // Actions
  const reload = () => {
    setTusId("");
    setStep(StepEnum.Upload);
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
    if (currentStep === StepEnum.MapColumns) {
      setUploadFromHeaderRowSelection(upload);
    }
    goBack();
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
    switch (currentStep) {
      case StepEnum.Upload:
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
      case StepEnum.RowSelection:
        return (
          <RowSelection
            upload={upload}
            onCancel={reload}
            onSuccess={(upload: any) => {
              setUploadFromHeaderRowSelection(upload);
              goNext();
            }}
            selectedHeaderRow={selectedHeaderRow}
            setSelectedHeaderRow={setSelectedHeaderRow}
          />
        );
      case StepEnum.MapColumns:
        return (
          <MapColumns
            template={template}
            upload={uploadFromHeaderRowSelection || upload}
            onSuccess={(_, columnsValues) => {
              setEnabledReview(true);
              setColumnsOrder(columnsValues);
              goNext();
            }}
            skipHeaderRowSelection={skipHeader}
            onCancel={skipHeader ? reload : () => goBack(StepEnum.RowSelection)}
            schemaless={schemaless}
            schemalessReadOnly={schemalessReadOnly}
            setColumnsValues={seColumnsValues}
            columnsValues={columnsValues}
            isLoading={reviewIsLoading || (!reviewIsStored && enabledReview)}
            onLoad={() => setEnabledReview(false)}
          />
        );
      case StepEnum.Review:
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
          <Button onClick={reload} colorScheme="primary" leftIcon={<PiArrowCounterClockwise />}>
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
