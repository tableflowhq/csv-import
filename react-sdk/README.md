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

### 1. Install the TableFlow React SDK

**NPM**

```bash
npm install @tableflow/react
```

**Yarn**

```bash
yarn add @tableflow/react
```

### 2. Add the Importer to your application

Create an importer, define your template, and retrieve data at https://app.tableflow.com/importers

```javascript
import { useState } from "react";
import { TableFlowImporter } from "@tableflow/react";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open TableFlow Importer</button>

      <TableFlowImporter
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        importerId={"53a84496-819d-4ec6-93b7-b4b56fb676ad"} // Replace with your importer ID from https://app.tableflow.com/importers
        darkMode={true}
        primaryColor="#7A5EF8"
        closeOnClickOutside={true}
        metadata={"{\"userId\": 1234, \"userEmail\": \"test@example.com\"}"}
        onComplete={(data, error) => {
          if (error) {
            // Handle import error
            alert(error);
          } else {
            // Use import data
            console.log(data);
          }
        }}
      />
    </>
  );
}
```

\
Need help or have a feature request? Reach out to us over [Slack](https://join.slack.com/t/tableflow/shared_invite/zt-1psu47idh-vnItf_BaWcIWih8flGZ0fw)!
