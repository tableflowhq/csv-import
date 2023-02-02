<h1 align="center">🪝 DB Webhooks</h1> </h1>
<p align="center">
    <em>Database Webhooks for Postgres
</em>
</p>


DB Webhooks is a utility for Postgres that triggers webhooks when rows are inserted, updated, or deleted. It uses
database triggers that send low-latency websocket messages to a lightweight Go application. This application then calls
the configured webhook(s) with a JSON payload that includes specified values from the database row.

![DB Webhooks Flow](https://i.imgur.com/E1hK2Hc.png)

## Use Cases

* **Send notifications:** Slack, Email, Text Message, Push Notification
* **Call serverless functions:** AWS Lambda, Google Cloud Functions, Azure Functions
* **Trigger analytics events:** Segment, Mixpanel, Amplitude
* **Connect to automation platforms:** Zapier, Trigger.dev, Pipedream

## Steps

1. Data added in Postgres table (INSERT)
2. Postgres trigger notifies DB Webhooks web server via websocket message
3. DB Webhooks formats data and sends webhook(s)


## Get Started

```shell
wget https://raw.githubusercontent.com/portola-labs/db-webhooks/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

The script will:

* Download the repo and necessary dependencies
* Prompt you to add your environment variables to the .env file
    * Note: Make sure the user you add has read permissions on the specified database
    * Note: This is also where you'll specific the POST request URL and body, which can contain templated variables
      which map to the column names whose values you want to include in the request
* Build the executable and run it as a service
* Create the trigger creation SQL which then has to be executed manually

## Roadmap

Right now the alpha version only supports monitoring INSERTS from one table and firing one webhook. We'll be adding
support for:

- Triggers on any number of tables
- Monitoring for different operations (INSERT, UPDATE, DELETE)
- Filters and mapping options the row data to the POST request

Let us know your feedback or feature requests! You can submit and issue or contact us at eric@inquery.io