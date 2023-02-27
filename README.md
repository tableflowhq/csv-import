<div align="center">
<a href="https://inquery.io"><img src="https://svgshare.com/i/qHg.svg" alt="Inquery"></a>

<em>Real-time events platform for Postgres</em>

[![Twitter](https://img.shields.io/twitter/url/https/twitter.com/inqueryio.svg?style=social&label=Follow%20%40inqueryio)](https://twitter.com/inqueryio) 
[![GitHub Repo stars](https://img.shields.io/github/stars/inqueryio/inquery?style=social)](https://github.com/inqueryio/inquery)

<h3>
    <a href="https://docs.inquery.io">Docs</a> |
    <a href="https://join.slack.com/t/inqueryio/shared_invite/zt-1psu47idh-vnItf_BaWcIWih8flGZ0fw">Slack</a> |
    <a href="https://inquery.io">Website</a> 
</h3>

</div>


Inquery is a utility for Postgres that triggers webhooks when rows are inserted, updated, or deleted. It uses
database triggers that send low-latency websocket messages to a Go application. This application then calls
the configured webhook(s) with a JSON payload that includes specified values from the database row.

![Inquery Flow](https://i.imgur.com/BgR5lbo.png)

## How It Works

1. Data is modified in Postgres table (INSERT, UPDATE, DELETE)
2. Postgres trigger notifies the Inquery web server via a websocket message
3. Inquery formats the data and sends the webhook(s)

![Inquery Create Slack Notification](https://i.imgur.com/Nv7MfQV.gif)

## Use Cases

* **Send notifications:** Slack, Email, Text Message, Push Notification
* **Call serverless functions:** AWS Lambda, Google Cloud Functions, Azure Functions
* **Trigger analytics events:** Segment, Mixpanel, Amplitude
* **Stream data real-time:** Snowflake, BigQuery, Clickhouse, Redshift

## Get Started

### Run Inquery locally

You can run Inquery locally with Docker.

```bash
git clone --depth 1 https://github.com/inqueryio/inquery.git
cd inquery
docker-compose up -d
```

Then open [http://localhost:3000](http://localhost:3000) to access Inquery.
<br>
<br>
**Note**: When connecting your database, if your Postgres host is `localhost`, you must use `host.docker.internal` instead to access it when running with Docker.

### Run Inquery on AWS (EC2)

**Note**: Make sure this instance is only accessible within your VPC.\
**Note**: These instructions are for Amazon Linux 2 AMI (HVM).

1. To install Docker, run the following command in your SSH session on the instance terminal:
```bash
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker $USER
logout # Needed to close the SSH session so Docker does not have to be run as root
```
2. To install `docker-compose`, run the following command in your ssh session on the instance terminal:
```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.16.0/docker-compose-$(uname -s)-$(uname -m)"  -o /usr/local/bin/docker-compose
sudo mv /usr/local/bin/docker-compose /usr/bin/docker-compose
sudo chmod +x /usr/bin/docker-compose
docker-compose version
```
3. Install and run Inquery
```bash
mkdir inquery && cd inquery
wget https://raw.githubusercontent.com/inqueryio/inquery/main/{.env,docker-compose.yml,.dockerignore,frontend.env}
docker-compose up -d
```

### Run Inquery Cloud (Beta)

Sign up for [Inquery Cloud](https://www.inquery.io/sign-up) early access and get a managed, cloud-hosted instance.

## Features

### Template Strings

When adding an action, you can insert data from the row into the response body of the POST request by using template strings.
<br>
For instance, if your table has a column called `email`, you would put the value `${email}` in the request body: `{"text":"User created: ${email}!"}`
<br>
<br>
The prefixes `new.` and `old.` can be used if a new (INSERT, UPDATE) or old (UPDATE, DELETE) row is available. If a prefix is not specified, the new or old values will be used depending on the event. Example: `{"text":"User updated: ${old.email} is now ${new.email}!"}`
<br>
<br>
The meta values `meta.table` (table name), `meta.schema` (schema name), `meta.event` (INSERT, UPDATE, or DELETE) can also be used.

## Roadmap

- Filters and mapping options for row data when sending a POST request
- Support for row sizes over 8000 bytes via chunking
- Persistent event queue

Let us know your feedback or feature requests! You can submit a GitHub issue or contact us at [hey@inquery.io](mailto:hey@inquery.io).
