<div align="center">
<a href="https://inquery.io"><img src="https://svgshare.com/i/qHg.svg" alt="Inquery"></a>

<em>Real-time events platform for Postgres</em>

[![Twitter](https://img.shields.io/twitter/url/https/twitter.com/inqueryio.svg?style=social&label=Follow%20%40inqueryio)](https://twitter.com/inqueryio) 
[![GitHub Repo stars](https://img.shields.io/github/stars/inqueryio/inquery?style=social)](https://github.com/inqueryio/inquery)

</div>


Inquery is a utility for Postgres that triggers webhooks when rows are inserted, updated, or deleted. It uses
database triggers that send low-latency websocket messages to a Go application. This application then calls
the configured webhook(s) with a JSON payload that includes specified values from the database row.

![DB Webhooks Flow](https://i.imgur.com/BgR5lbo.png)
\## Use Cases

* **Send notifications:** Slack, Email, Text Message, Push Notification
* **Call serverless functions:** AWS Lambda, Google Cloud Functions, Azure Functions
* **Trigger analytics events:** Segment, Mixpanel, Amplitude
* **Stream data real-time:** Snowflake, BigQuery, Clickhouse, Redshift

![Inquery Create Slack Notification](https://i.imgur.com/Nv7MfQV.gif)

## Steps

1. Data modified in Postgres table (INSERT, UPDATE, DELETE)
2. Postgres trigger notifies DB Webhooks web server via websocket message
3. DB Webhooks formats data and sends webhook(s)

## Get Started

Docker: TODO

## Roadmap

- Filters and mapping options the row data to the POST request

Let us know your feedback or feature requests! You can submit an issue or contact us at hello@inquery.io
