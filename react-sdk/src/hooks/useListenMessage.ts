import { useEffect } from "react";

export default function useListenMessage(importerId: string, onComplete?: (data: any) => void, modalOnCloseTriggered?: () => void) {
  useEffect(() => {
    let postMessages: string[] = [];

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
        // Add extra data field for temporary backwards compatibility
        // TODO: Remove in later version
        const response = {
          ...messageData?.data,
          // Add the deprecated data field with getter and setter
          get data() {
            console.warn(
              "WARNING: the extra data field is deprecated in the onComplete and will be removed in a later version. The parent object contains all of the import data needed."
            );
            return this._data;
          },
          set data(value) {
            console.warn(
              "WARNING: the extra data field is deprecated in the onComplete and will be removed in a later version. The parent object contains all of the import data needed."
            );
            this._data = value;
          },
        };
        response._data = messageData?.data;

        onComplete(response);
        postMessages.push(messageData?.id);
      }
      if (messageData?.type === "close" && modalOnCloseTriggered) {
        modalOnCloseTriggered();
        postMessages.push(messageData?.id);
      }
    }
    window.addEventListener("message", messageListener);
    return () => {
      window.removeEventListener("message", messageListener);
    };
  }, []);
}
