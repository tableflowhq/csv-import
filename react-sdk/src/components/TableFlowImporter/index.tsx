import { useEffect, useLayoutEffect, useRef, useState } from "react";
import arrowUp from "./assets/arrowUp";
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
    ...props
}: TableFlowImporterProps) {
    const ref = useRef(null);
    const current = ref.current as any;
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

    const urlParams = {
        importerId,
        darkMode: darkMode.toString(),
        primaryColor,
        metadata,
    };
    const searchParams = new URLSearchParams(urlParams);
    const uploaderUrl = `${hostUrl}?${searchParams}`;
    const backdropClick = (e: any) => closeOnClickOutside && onRequestClose();

    useEffect(() => {
        try {
            JSON.parse(metadata);
        } catch (e) {
            console.error('The "metadata" prop is not a valid JSON string. Please check the documentation for more details.');
        }
    }, [metadata]);

    return (
        <dialog ref={ref} className={dialogClass} onClick={backdropClick} {...props}>
            <iframe src={uploaderUrl} />
            <button className={closeClass} onClick={() => onRequestClose()}>
                <span dangerouslySetInnerHTML={{ __html: cross }} />
            </button>
        </dialog>
    );
}
