<h1 align="center">🪝 DB Webhooks</h1> </h1>
<p align="center">
    <em>Database Webhooks for Postgres
</em>
</p>


DB Webhooks is a utility for Postgres that triggers webhooks when rows are inserted, updated, or deleted. It uses
database triggers that send low-latency websocket messages to a lightweight Go application. This application then calls
the configured webhook(s) with a JSON payload that includes specified values from the database row.

## Use Cases

* **Send notifications:** Slack, Email, Text Message, Push Notification
* **Call serverless functions:** AWS Lambda, Google Cloud Functions, Azure Functions
* **Trigger analytics events:** Segment, Mixpanel, Amplitude
* **Connect to automation platforms:** Zapier, Trigger.dev, Pipedream

## Steps

1. Data added in Postgres table (INSERT)
2. Postgres trigger notifies DB Webhooks web server via websocket message
3. DB Webhooks formats data and sends webhook(s)

![db-webhooks-flow.png](assets%2Fdb-webhooks-flow.png)

## Get Started

```
wget https://raw.githubusercontent.com/portola-labs/db-webhooks/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

The script will:

1. Download the repo and necessary dependencies
2. Prompt you to add your environment variables to the .env file
   Make sure the user you add has read permissions on the specified database
   This is also where you'll specific the POST request URL and body, which can contain templated variables which map to
   the column names whose values you want to include in the request
3. Build the executable and run it as a service
4. Create the trigger creation SQL which then has to be executed manually

## Roadmap

Right now the alpha version only supports monitoring INSERTS from one table and firing one webhook. We'll be adding
support for:

- Triggers on any number of tables
- Monitoring for different operations (INSERT, UPDATE, DELETE)
- Filters and mapping options the row data to the POST request

Let us know your feedback or feature requests! You can submit and issue or contact us at eric@inquery.io