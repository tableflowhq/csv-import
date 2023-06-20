import { saveAs } from "file-saver";
import { baseURLExternal } from "./api";

async function downloadFile(importId: string, apiKey: string, fileName: string = "tableflow-data.csv"): Promise<any> {
  fetch(`${baseURLExternal}import/${importId}/download`, {
    headers: {
      Authorization: `bearer ${apiKey}`,
      "Content-Type": "text/csv",
    },
  })
    .then((response) => response.blob())
    .then((blob) => saveAs(blob, fileName))
    .catch((error) => {
      console.log(error);
    });
}

export default downloadFile;
