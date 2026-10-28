import { readFileSync } from 'node:fs';

export function secret(env, name) {
  if (env[name] && env[`${name}_FILE`]) throw new Error(`Set ${name} or ${name}_FILE, not both.`);
  return env[`${name}_FILE`] ? readFileSync(env[`${name}_FILE`], 'utf8').trim() : env[name] || '';
}
function integer(env, name, fallback, min, max) {
  const value = env[name] === undefined ? fallback : Number(env[name]);
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${name} must be an integer between ${min} and ${max}.`);
  return value;
}
export function readConfig(env = process.env) {
  const production = env.NODE_ENV === 'production';
  const mode = env.DATA_MODE || (production ? 'postgres' : 'demo');
  if (!['demo', 'postgres'].includes(mode)) throw new Error('DATA_MODE must be demo or postgres.');
  if (production && mode === 'demo') throw new Error('Production requires PostgreSQL. Use development mode for sample data.');
  const auth = production || env.AUTH_ENABLED === 'true';
  const origin = env.APP_ORIGIN || 'http://localhost:3000';
  let parsed;
  try { parsed = new URL(origin); } catch { throw new Error('APP_ORIGIN must be an absolute URL.'); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin || parsed.username || parsed.password) throw new Error('APP_ORIGIN must contain only the scheme, hostname and optional port.');
  if (production && parsed.protocol !== 'https:') throw new Error('Production APP_ORIGIN must use HTTPS.');
  const passwordHash = secret(env, 'ADMIN_PASSWORD_HASH');
  const ingestKey = secret(env, 'INGEST_API_KEY');
  const admin = env.ADMIN_USERNAME || '';
  if (auth && (!admin || admin.length > 80 || !/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{64}$/.test(passwordHash))) throw new Error('Authentication requires ADMIN_USERNAME and a valid ADMIN_PASSWORD_HASH. Run npm run auth:hash.');
  if (production && ingestKey.length < 32) throw new Error('Production INGEST_API_KEY must contain at least 32 characters.');
  const connectionString = secret(env, 'DATABASE_URL');
  const password = secret(env, 'PGPASSWORD');
  const sslMode = env.DATABASE_SSL || (production ? 'verify-full' : 'disable');
  if (!['disable', 'verify-full'].includes(sslMode)) throw new Error('DATABASE_SSL must be disable or verify-full.');
  if (mode === 'postgres' && !connectionString && !(env.PGHOST && env.PGUSER && env.PGDATABASE && password)) throw new Error('PostgreSQL requires DATABASE_URL or PGHOST, PGUSER, PGDATABASE and PGPASSWORD.');
  if (connectionString) {
    let url;
    try { url = new URL(connectionString); } catch { throw new Error('DATABASE_URL is invalid.'); }
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('DATABASE_URL must use postgres:// or postgresql://.');
    if (['sslmode', 'sslcert', 'sslkey', 'sslrootcert'].some(key => url.searchParams.has(key))) throw new Error('Configure database TLS using DATABASE_SSL and DATABASE_CA_FILE, not URL SSL parameters.');
  }
  return {
    production, mode, auth, origin, admin, passwordHash, ingestKey,
    host: env.HOST || '127.0.0.1', port: integer(env, 'PORT', 3000, 1, 65535),
    trustProxy: env.TRUST_PROXY === 'true',
    sessionSeconds: integer(env, 'SESSION_TTL_SECONDS', 28800, 60, 86400),
    rateLimit: integer(env, 'RATE_LIMIT_PER_MINUTE', 240, 10, 10000),
    streamLimit: integer(env, 'MAX_STREAMS', 200, 1, 5000),
    exportLimit: integer(env, 'EXPORT_LIMIT', 10000, 1, 100000),
    database: {
      ...(connectionString ? { connectionString } : { host: env.PGHOST, port: integer(env, 'PGPORT', 5432, 1, 65535), user: env.PGUSER, database: env.PGDATABASE, password }),
      ssl: sslMode === 'disable' ? false : { rejectUnauthorized: true, ...(env.DATABASE_CA_FILE ? { ca: readFileSync(env.DATABASE_CA_FILE, 'utf8') } : {}) },
      max: integer(env, 'DATABASE_POOL_SIZE', 10, 2, 50), connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000, statement_timeout: 10000, application_name: 'commerce-platform',
    },
  };
}
