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

![TableFlow Importer Modal](https://tableflow-assets-cdn.s3.amazonaws.com/importer-modal-20230613b.png)

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

### 👩‍💻 Self-Hosted Deploy (local)

You can run TableFlow locally with Docker:

```bash
git clone https://github.com/tableflowhq/tableflow.git
cd tableflow
cp .env.example .env
docker-compose up -d
```

Then add the TableFlowImporter in your application with the [React](https://tableflow.com/docs/sdk/react)
or [JS](https://tableflow.com/docs/sdk/javascript) SDK, setting the `hostUrl` param to `localhost:3001`.

### 🤖 Self-Hosted Deploy (AWS EC2)

**Important notes:**

1. [x] Update your network settings to only allow port 3001 (the importer iframe) and 3003 (the file import server) to
   be accessible from where your users will import data, most likely public
2. [x] Update `TABLEFLOW_WEB_IMPORTER_URL` in your .env.example file with the URL where you're hosting TableFlow

One-line install script (for Amazon Linux):

```bash
sudo yum update -y && \
sudo yum install -y docker git && \
sudo service docker start && \
sudo usermod -a -G docker $USER && \
sudo wget -O /usr/local/bin/docker-compose https://github.com/docker/compose/releases/download/v2.19.1/docker-compose-$(uname -s)-$(uname -m) && \
sudo mv /usr/local/bin/docker-compose /usr/bin/docker-compose && \
sudo chmod +x /usr/bin/docker-compose && \
mkdir tableflow && cd tableflow && \
wget https://raw.githubusercontent.com/tableflowhq/tableflow/main/{.env.example,docker-compose.yml,docker-compose.base.yml} && \
mv .env.example .env && \
sg docker -c 'docker-compose up -d'
```

## Get In Touch

Let us know your feedback or feature requests! You can submit a GitHub issue, reach out
over [Slack](https://join.slack.com/t/tableflow/shared_invite/zt-1psu47idh-vnItf_BaWcIWih8flGZ0fw), or email us
at [hey@tableflow.com](mailto:hey@tableflow.com)
