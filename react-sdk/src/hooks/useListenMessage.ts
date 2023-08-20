import { useEffect, useState } from "react";

export default function useListenMessage(importerId: string, onComplete?: (data: { data: any; error: any }) => void, onRequestClose?: () => void) {
    const [postMessages, setPostMessages] = useState<any[]>([]);

    useEffect(() => {
        function messageListener(e: any) {
            if (!e || !e?.data) return;

            const messageData = e.data;

            if (
                messageData?.source !== "tableflow-importer" ||
                messageData?.importerId !== importerId ||
                !messageData?.id ||
                postMessages.includes(messageData.id)
            ) {
                return;
            }

            if (messageData?.type === "complete" && onComplete) {
                onComplete({
                    data: messageData?.data || null,
                    error: messageData?.error || null,
                });
                setPostMessages((prev) => [...prev, messageData?.id]);
            }
            if (messageData?.type === "close" && onRequestClose) {
                onRequestClose();
                setPostMessages((prev) => [...prev, messageData?.id]);
            }
        }
        window.addEventListener("message", messageListener);
        return () => {
            window.removeEventListener("message", messageListener);
        };
    }, []);
}
