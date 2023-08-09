import { useEffect, useRef, useState } from "react";
import cross from "./assets/cross";
import { TableFlowImporterProps } from "./types";
import "./style/button.css";

export default function TableFlowImporter({
    // TODO: Include "as" parameter to launch as a div
    isOpen = true,
    onRequestClose = () => null,
    importerId,
    hostUrl,
    darkMode = false,
    primaryColor = "#7a5ef8",
    metadata = "{}",
    closeOnClickOutside,
    className,
    onComplete,
    showImportLoadingStatus,
    ...props
}: TableFlowImporterProps) {
    const ref = useRef(null);
    const current = ref.current as any;
    const [isLoading, setIsLoading] = useState(false);
    const loadingRef = useRef(null);

    useEffect(() => {
        if (current) {
            if (isOpen) current.showModal();
            else current.close();
        }
    }, [isOpen, current]);

    const baseClass = "TableFlowImporter";
    const themeClass = darkMode && `${baseClass}-dark`;
    const dialogClass = [`${baseClass}-dialog`, themeClass, className].filter((i) => i).join(" ");
    const closeClass = `${baseClass}-close`;
    const loadingClass = `${baseClass}-loading`;

    const urlParams = {
        importerId,
        darkMode: darkMode.toString(),
        primaryColor,
        metadata,
        isOpen: isOpen.toString(),
        onComplete: onComplete ? "true" : "false",
    };
    const searchParams = new URLSearchParams(urlParams);
    const defaultImporterUrl = "https://importer.tableflow.com";
    const uploaderUrl = `${hostUrl ? hostUrl : defaultImporterUrl}?${searchParams}`;
    const backdropClick = (e: any) => closeOnClickOutside && onRequestClose();

    useEffect(() => {
        try {
            JSON.parse(metadata);
        } catch (e) {
            console.error('The "metadata" prop is not a valid JSON string. Please check the documentation for more details.');
        }
    }, [metadata]);

    useEffect(() => {
        window.onmessage = function (e) {
            if (onComplete) {
                let messageData;

                try {
                    messageData = JSON.parse(e.data);
                } catch (e) {
                    // do nothing
                }

                if (messageData?.type === "complete") {
                    onComplete({
                        data: messageData?.data || null,
                        error: messageData?.error || null,
                    });
                }
            }

            if (e.data == "close") {
                onRequestClose();
            }
        };
    }, []);

    useEffect(() => {
        if (showImportLoadingStatus) {
            setIsLoading(true);
        }
    }, [showImportLoadingStatus]);
    

    return (
        <dialog ref={ref} className={dialogClass} onClick={backdropClick} {...props}>
            <iframe src={uploaderUrl} />
            <button className={closeClass} onClick={() => onRequestClose()}>
                <span dangerouslySetInnerHTML={{ __html: cross }} />
            </button>
            {isLoading && (
            <div ref={loadingRef} className={loadingClass}>
                Loading...
            </div>
        )}
        </dialog>
    );
}
