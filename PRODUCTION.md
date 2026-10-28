# Production deployment

The supported production system is **Node.js → PostgreSQL → authenticated dashboard**, with either the protected ingestion API or an optional Kafka consumer feeding the warehouse. Docker Compose provides a single-server deployment with Caddy for HTTPS. The original Python, Spark, dbt and Airflow files are retained as legacy examples; they are not run by this deployment.

This is a **single-workspace, single-administrator application**. It does not implement public registration, per-customer tenancy, role-based permissions or high availability. Do not expose it as a multi-tenant SaaS application without adding those controls.

## Prerequisites

- A Linux server with Docker Engine and the Compose v2 plugin, at least 2 CPU cores and 4 GiB RAM for the baseline stack. Load test for your own traffic.
- A domain whose DNS points to the server. Allow incoming TCP 80/443 and UDP 443. Do not expose PostgreSQL or the Node port.
- Node.js 24 LTS for setup, checks and local development.
- An operator responsible for updates, external monitoring, encrypted backups and recovery drills.

Commands below run from the project directory containing `compose.production.yml`.

## Prepare configuration and secrets

```sh
npm ci --ignore-scripts
npm run secrets:setup
cp .env.production.example .env.production
```

The setup command asks for a 14–256 character administrator password with input hidden. It stores a salted scrypt hash and generates random database passwords and an ingestion key. It preserves existing secret files. Update `DOMAIN` and `ADMIN_USERNAME` in `.env.production`.

On Windows, use `Copy-Item .env.production.example .env.production` instead of `cp`. The server itself should run on Linux through Docker.

`secrets/` is ignored by Git and Docker builds. Its parent directory has mode 0700 on Unix. Files are read-only and mounted only into the services that need them. Secret files use 0444 so different non-root container UIDs can read their explicitly mounted files; host access is restricted by the parent directory. Keep a secure, separate backup. On Windows, restrict access with filesystem ACLs.

The empty `secrets/kafka_sasl_password` file is a placeholder for the optional worker. Populate it only if your Kafka cluster requires SASL. Secret contents are never sent to the browser or written to application logs.

## Deploy

```sh
docker compose --env-file .env.production -f compose.production.yml up -d --build
docker compose --env-file .env.production -f compose.production.yml ps
docker compose --env-file .env.production -f compose.production.yml logs --tail=100 app migrate
```

Open `https://YOUR_DOMAIN` and sign in with the administrator username and password chosen above. Production starts with an **empty warehouse**, not sample data.

The database initializes a restricted runtime role. A separate one-shot migration container uses the database owner to apply versioned migrations and grant runtime permissions. The app waits for successful migrations and database health. It runs as the non-root `node` user, with a read-only root filesystem, dropped capabilities, resource limits and a bounded shutdown period. Only Caddy publishes network ports.

Caddy obtains and renews certificates for the configured domain. Automatic certificates require working public DNS and reachable ports. For an internal-only domain, supply your organization’s TLS termination and adjust the proxy configuration rather than bypassing certificate validation.

Image tags track the Node 24, PostgreSQL 17 and Caddy 2 release lines. Package dependencies are exact and locked. For a controlled release, resolve and pin approved image digests in your image registry; apply tested patch updates regularly. Do not deploy the legacy `docker-compose.yml` publicly.

## Ingest real transactions

`POST /api/ingest` requires `Authorization: Bearer <ingestion-key>` and `Content-Type: application/json`. It accepts one transaction or `{ "transactions": [...] }`, with 1–100 records and a maximum body of 128 KiB. A valid browser session cannot substitute for the ingestion key.

```json
{
  "transaction_id": "payment-provider-unique-id",
  "order_id": "ORDER-1001",
  "customer_id": "customer-1001",
  "customer_name": "Example Customer",
  "customer_email": "customer@example.com",
  "product_id": 1001,
  "product_name": "Studio Headphones",
  "category": "Electronics",
  "quantity": 1,
  "unit_price": 129.00,
  "total_amount": 129.00,
  "payment_method": "card",
  "country": "United States",
  "status": "Completed",
  "timestamp": "2026-10-28T12:00:00Z"
}
```

Set `APP_ORIGIN=https://YOUR_DOMAIN` and `INGEST_API_KEY_FILE` to the local secret path, then submit a JSON file without placing the key in a shell argument:

```sh
npm run ingest -- /path/to/transactions.json
```

The timestamp must describe the actual transaction, no more than five minutes in the future. The legacy Python format without an offset is interpreted as UTC. Amounts must be positive USD numbers with at most two decimals; total must exactly equal quantity × unit price. Payments are `card`, `bank_transfer`, `mobile_money` or `cash`; statuses are `Completed`, `Pending` or `Failed`. Missing status defaults to `Completed` for legacy completed-transaction events. Customer name and email are optional; customer ID is required. If product ID is supplied it must be a positive integer.

Events are **immutable**. Repeating an identical normalized event returns a duplicate count. Reusing an ID with different data returns HTTP 409, and the entire batch rolls back. This API is an append-only transaction contract, not an order-status update endpoint. Choose event IDs and the completed-transaction feed accordingly.

## Optional Kafka ingestion

Use an externally operated Kafka cluster with TLS. Set `KAFKA_BROKERS` and, when required, the SASL mechanism and username in `.env.production`, and the password in `secrets/kafka_sasl_password`. Supported SASL mechanisms are `plain`, `scram-sha-256` and `scram-sha-512`.

```sh
docker compose --env-file .env.production -f compose.production.yml --profile kafka up -d --build
docker compose --env-file .env.production -f compose.production.yml logs --tail=100 worker
```

The consumer group defaults to `commerce-platform-v1`. New groups start from the current offset; existing groups resume committed offsets. Ensure the topic already exists. Provision broker-side ACLs restricted to the topic and consumer group. This worker does not provision a broker cluster.

Offsets are committed only after a successful database transaction or durable quarantine. Retries deduplicate by transaction ID. Malformed, oversized and conflicting events enter `commerce_dead_letters`. Database outages are retried rather than treated as invalid data. Alert on growing dead-letter counts and consumer lag. The dashboard does not claim Kafka connectivity; monitor the worker and broker independently. Raw quarantined payloads can contain personal data, so restrict and expire them according to your policy.

## Security and configuration

- Production requires PostgreSQL, an HTTPS `APP_ORIGIN`, a valid administrator password hash, and an ingestion key of at least 32 characters. Missing settings fail startup. Demo mode is rejected in production.
- Browser sessions use random tokens stored as hashes in PostgreSQL. Cookies are Secure, HttpOnly, SameSite=Strict and scoped with the `__Host-` prefix. Logout revokes the session and closes local streams; other replicas validate session revocation on heartbeat.
- Sign-in and logout require the exact configured Origin. No cross-origin API access is enabled. Login attempts, requests, body size, exports and SSE connections are bounded.
- `TRUST_PROXY=true` is appropriate only when the app is reachable exclusively through the trusted proxy. The supplied deployment publishes no app port. Disable it for direct access; never trust client-supplied forwarding headers on a public app port.
- SQL uses parameterized values and fixed sort clauses. The runtime role has no schema ownership or migration permissions. CSV values are quoted and protected against formula injection.
- Logs contain request IDs, route templates, status and duration; no request bodies, cookies, tokens, searches or database error messages. Proxy request logging is off by default.
- For a managed database, supply `DATABASE_URL` or `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER` and a password. Use `DATABASE_SSL=verify-full` and, where needed, `DATABASE_CA_FILE`. Certificate verification is never disabled in that mode. `DATABASE_SSL=disable` in Compose is limited to the private Docker bridge; use host-level disk/network protection and change it if the database leaves that bridge.
- Secret settings accept a `*_FILE` alternative. Do not set the environment value and its file alternative together.

Defaults: session lifetime 8 hours, 240 requests/minute per IP, 3 SSE connections per IP and 200 total per app process, 10 sign-in attempts/15 minutes, 10,000 export rows, 10 database pool connections. Adjust `SESSION_TTL_SECONDS`, `RATE_LIMIT_PER_MINUTE`, `MAX_STREAMS`, `EXPORT_LIMIT` and `DATABASE_POOL_SIZE` for measured workloads. Limits are process-local; use a shared gateway limiter when scaling horizontally.

The application uses PostgreSQL notifications to invalidate metrics and refresh browsers. Browser polling every 15 seconds repairs missed notifications. SSE is a refresh signal, not a durable event delivery API. Metrics are cached for up to three seconds and computed from a consistent SQL snapshot. Exports are bounded; use a separate reporting job for larger extracts. Report windows are rolling 1/7/30 days. Plan partitioning and summary tables before very large transaction volumes.

## Backups and recovery

Database volumes survive container replacement; volumes are not backups. Schedule encrypted backups to storage outside this server and monitor backup age and restore success. Define recovery point and recovery time objectives for your business.

For a portable manual backup, first create a `backups/` directory, then:

```sh
docker compose --env-file .env.production -f compose.production.yml exec -T database pg_dump -U postgres -d commerce -Fc -f /tmp/commerce-backup.dump
docker compose --env-file .env.production -f compose.production.yml cp database:/tmp/commerce-backup.dump ./backups/commerce-backup.dump
```

Copy the backup to encrypted off-host storage. Restore to a **separate test database** using `pg_restore --no-owner`; run migrations, authenticate, verify row counts and reporting totals, and ingest a test event there. Never test restores against the live primary. For point-in-time recovery or stronger availability, use managed PostgreSQL with WAL archiving and test failover.

Back up `secrets/` separately. To rotate a database password, change the role password through an authenticated database administrator session, update the matching secret, and recreate dependent services. Updating the file alone does not change an initialized database password. Rotate the administrator hash and delete `commerce_sessions` to revoke all sessions after a credential incident. Rotate ingestion keys with a coordinated producer rollout; only one active key is supported.

No automatic transaction deletion is performed. Define business/legal retention before scheduling deletion. Expired sessions are removed during sign-in; schedule additional session cleanup if needed. Review and expire quarantined payloads. Add alerts for disk space and table growth.

## Operations and releases

- `/healthz` reports process liveness; `/readyz` checks the required database schema. Docker uses readiness. The public proxy blocks these internal probes; monitor public HTTPS availability separately.
- Alert on readiness failures, HTTP 5xx/429, database connection exhaustion, disk usage, backup age, Kafka lag and dead letters. Restart policies do not replace monitoring.
- Before release: run checks and tests, review dependency/image updates, build the image, restore a recent backup into staging, and run login/ingestion/reporting tests there.
- Deploy compatible, additive migrations before switching application images. Preserve the previously approved image tag/digest for rollback. Do not roll back a database schema blindly; restore or roll forward using a reviewed migration plan.
- Shutdown stops new requests, closes SSE clients, drains HTTP requests and closes database connections. The container init process forwards signals.

```sh
npm run check
npm test
npm audit --omit=dev --audit-level=high
```

Local SQL tests use the PGlite PostgreSQL engine. If `TEST_DATABASE_URL` is set, they use a PostgreSQL server with isolated temporary schemas. GitHub Actions starts PostgreSQL 17, runs the same suite, audits production dependencies, validates Compose, builds the image, and smoke-tests the app container. These CI checks only run after the source is pushed to a repository with Actions enabled.

Local development remains available with `npm start` at http://localhost:3000 and defaults to fictional demo data. To exercise authentication locally, set `AUTH_ENABLED=true`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` and the exact local `APP_ORIGIN`. Local auth uses a non-Secure cookie for HTTP development; production always uses the Secure cookie.

## Implementation references

[Node.js release policy](https://nodejs.org/en/about/previous-releases), [Node.js cryptography](https://nodejs.org/api/crypto.html), [node-postgres parameterized queries](https://node-postgres.com/features/queries), [node-postgres TLS configuration](https://node-postgres.com/features/ssl), [KafkaJS consumers](https://kafka.js.org/docs/consuming), [Caddy reverse proxy and streaming](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy).
