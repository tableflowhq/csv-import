<div align="center">
<a href="https://tableflow.com"><img src="https://tableflow-assets-cdn.s3.amazonaws.com/TableFlow-readme-header.png" width="600" alt="TableFlow"></a>

<em>The Open Source CSV Importer</em>

<h3>
    <a href="https://tableflow.com/docs">Docs</a> |
    <a href="https://join.slack.com/t/tableflow/shared_invite/zt-1psu47idh-vnItf_BaWcIWih8flGZ0fw">Slack</a> |
    <a href="https://twitter.com/tableflow">Twitter</a> |
    <a href="https://tableflow.com">Website</a> 
</h3>

</div>

## Getting Started

### 1. Install the TableFlow JS SDK

**NPM**

```bash
npm install @tableflow/js
```

**Yarn**

```bash
yarn add @tableflow/js
```

### 2. Add the Importer to your application

Create an importer, define your template, and retrieve data at https://app.tableflow.com/importers

```javascript
import { createTableFlowImporter } from "@tableflow/js";

const args = {
  importerId: "53a84496-819d-4ec6-93b7-b4b56fb676ad", // Replace with your importer ID from https://app.tableflow.com/importers
  darkMode: true,
  primaryColor: "#7a5ef8",
  metadata: '{"userId": 1234, "userEmail": "test@example.com"}',
  onRequestClose: () => dialog.close(),
};

const uploadButton = document.getElementById("uploadButton");

const dialog = createTableFlowImporter(args);

uploadButton.addEventListener("click", () => {
  dialog?.showModal();
});
```

Or directly in the HTML

```html
<script src="https://unpkg.com/@tableflow/js@latest/build/index.js"></script>

<button id="uploadButton">Upload file</button>

<script>
  const args = {
    importerId: "53a84496-819d-4ec6-93b7-b4b56fb676ad", // Replace with your importer ID from https://app.tableflow.com/importers
    darkMode: true,
    primaryColor: "#7a5ef8",
    metadata: '{"userId": 1234, "userEmail": "test@example.com"}',
    onRequestClose: () => dialog.close(),
  };

  const uploadButton = document.getElementById("uploadButton");

  const dialog = createTableFlowImporter(args);

  uploadButton.addEventListener("click", () => {
    dialog?.showModal();
  });
</script>
```

\
Need help or have a feature request? Reach out to us over [Slack](https://join.slack.com/t/tableflow/shared_invite/zt-1psu47idh-vnItf_BaWcIWih8flGZ0fw)!
