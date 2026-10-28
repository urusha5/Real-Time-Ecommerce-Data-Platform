#!/bin/sh
set -eu
export PG_APP_PASSWORD="$(cat /run/secrets/app_database_password)"
psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --set ON_ERROR_STOP=1 <<'SQL'
\getenv app_password PG_APP_PASSWORD
CREATE ROLE commerce_app LOGIN PASSWORD :'app_password';
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT CONNECT ON DATABASE commerce TO commerce_app;
SQL
unset PG_APP_PASSWORD
