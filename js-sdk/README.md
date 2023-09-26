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

Create an importer, define your template, and retrieve data on [TableFlow](https://app.tableflow.com/importers).
\
The full SDK reference is available in our [docs](https://tableflow.com/docs/sdk-reference/javascript).

```javascript
import createTableFlowImporter from "@tableflow/js";

const importer = createTableFlowImporter({
  importerId: "6de452a2-bd1f-4cb3-b29b-0f8a2e3d9353", // Use your importer ID from https://app.tableflow.com/importers
  modalOnCloseTriggered: () => importer.close(),
  onComplete: (data, error) => console.log(data),
  darkMode: true,
});

const uploadButton = document.getElementById("uploadButton");
uploadButton.addEventListener("click", () => {
  importer?.showModal();
});
```

Or directly in HTML

```html
<head>
  <script src="https://unpkg.com/@tableflow/js@latest/build/index.js"></script>
</head>
<body>
  <button id="uploadButton">Open TableFlow Importer</button>
  <script>
    const importer = createTableFlowImporter({
      importerId: "6de452a2-bd1f-4cb3-b29b-0f8a2e3d9353", // Use your importer ID from https://app.tableflow.com/importers
      modalOnCloseTriggered: () => importer.close(),
      onComplete: (data, error) => console.log(data),
      darkMode: true,
    });

    const uploadButton = document.getElementById("uploadButton");
    uploadButton.addEventListener("click", () => {
      importer?.showModal();
    });
  </script>
</body>
```

\
Need help or have a feature request? Reach out to us over [Slack](https://join.slack.com/t/tableflow/shared_invite/zt-1psu47idh-vnItf_BaWcIWih8flGZ0fw)!
