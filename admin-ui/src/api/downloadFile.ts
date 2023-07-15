import { saveAs } from "file-saver";
import notification from "../utils/notification";
import { baseURLExternal } from "./api";

async function downloadFile(importId: string, apiKey: string, fileName: string = "tableflow-data.csv"): Promise<any> {
  fetch(`${baseURLExternal}import/${importId}/download`, {
    headers: {
      Authorization: `bearer ${apiKey}`,
      "Content-Type": "text/csv",
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        const res = await response.json();
        throw res.error ? res.error : "An unknown error occurred, please try again";
      }
      return response.blob();
    })
    .then((blob) => saveAs(blob, fileName))
    .catch((error) => {
      notification({ title: "Error", message: error, type: "error" });
    });
}

export default downloadFile;
