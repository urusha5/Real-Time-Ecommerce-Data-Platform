# Run the Real-Time E-commerce Data Platform

## Local dashboard

Install Node.js 24 LTS, then run these commands from this project folder:

```sh
npm ci --ignore-scripts
npm start
```

Open **http://localhost:3000**. Local development uses a fictional dataset and requires no database or Python installation. To change the port in PowerShell, set `$env:PORT = 3002` before `npm start`.

Use `npm run dev` to restart the server after backend edits. Reload the browser after changing frontend files. Run `npm run check` and `npm test` before committing.

## Production

Follow [PRODUCTION.md](PRODUCTION.md). Production uses PostgreSQL, administrator authentication, a separate ingestion key, HTTPS and Docker-managed secret files.

```sh
npm run secrets:setup
cp .env.production.example .env.production
# Configure DOMAIN and ADMIN_USERNAME.
docker compose --env-file .env.production -f compose.production.yml up -d --build
```

On Windows, use `Copy-Item` instead of `cp`. Do not commit `.env.production`, `.env`, `secrets/`, `node_modules/` or database backups.

## Real transaction ingestion

Submit validated JSON through the protected ingestion API:

```sh
npm run ingest -- /path/to/transaction.json
```

Set `APP_ORIGIN` and `INGEST_API_KEY_FILE` first. See PRODUCTION.md for the transaction contract and optional Kafka deployment profile.

## Legacy Python infrastructure

The original Python producer/processor, dbt models, Airflow DAG and Metabase Compose stack remain reference material. They are not part of the supported production deployment. The lightweight Python processor is not Apache Spark. Use the Node ingestion API or Kafka worker for the production warehouse.

The legacy Docker file is for local development only. It requires `POSTGRES_PASSWORD` and binds Kafka/PostgreSQL/Metabase to loopback. Metabase uses port 3001; the custom dashboard uses port 3000. The legacy raw_transactions schema is separate from the production commerce_transactions schema.
