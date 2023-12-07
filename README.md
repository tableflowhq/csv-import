<div align="center">
<a href="https://tableflow.com"><img src="https://tableflow-assets-cdn.s3.amazonaws.com/TableFlow-readme-header.png" width="600" alt="TableFlow"></a>

<em>The Open Source CSV Importer</em>

<h3>
    <a href="https://tableflow.com/docs">Docs</a> |
    <a href="https://example-crm.tableflow.com/">Demo</a> |
    <a href="https://join.slack.com/t/tableflow/shared_invite/zt-1psu47idh-vnItf_BaWcIWih8flGZ0fw">Slack</a> |
    <a href="https://tableflow.com">Website</a> 
</h3>

</div>

## Features

* Drop-in SDK to add CSV import to your application
* Smart column mapping
* Data types and validations
* Frontend callbacks to retrieve data

![TableFlow Importer Modal](https://tableflow-assets-cdn.s3.amazonaws.com/importer-review-cover.png)

## How It Works

1. Define the columns your users can import
2. Embed the TableFlow Importer in your app with the [React](https://tableflow.com/docs/sdk/react)
   or [JS](https://tableflow.com/docs/sdk/javascript) SDK
3. Your users import their files
4. Retrieve the cleaned and mapped data from a frontend callback

```jsx
<TableFlowImporter
  template={{ // Define the file columns you want to import
    columns: [
      {
        name: "First Name",
        validations: [
          {
            validate: "not_blank",
            message: "Cell must contain a value",
          },
        ],
      },
    ],
    ... // Add other columns, data types, validations, and more
  }}
  onComplete={(data) => console.log(data)} // Retrieve the data
/>
```

## Get Started

### ☁️ TableFlow Cloud

The quickest way to get started with TableFlow is signing up for free
to [TableFlow Cloud](https://app.tableflow.com/signup).

### 👩‍💻 Self-Hosted Deploy

Follow the [deployment documentation](https://tableflow.com/docs/deploy-tableflow) to try TableFlow out locally on your
machine or deploy in your VPC.

## Get In Touch

Let us know your feedback or feature requests! You can submit
a [GitHub issue](https://github.com/tableflowhq/tableflow/issues/new), reach out
over [Slack](https://join.slack.com/t/tableflow/shared_invite/zt-1psu47idh-vnItf_BaWcIWih8flGZ0fw), or email us
at [hey@tableflow.com](mailto:hey@tableflow.com)
