import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readConfig } from './config.mjs';
import { DemoRepository } from './repositories/demo.mjs';
import { PostgresRepository } from './repositories/postgres.mjs';
import { toCSV } from './data.mjs';
import { parseQuery, normalizeTransaction } from './validation.mjs';
import { HttpError, RateLimiter, digest, equal, verifyPassword, newSession, sessionToken, sessionCookie, requireOrigin, readJSON } from './security.mjs';

const publicDir = new URL('./public/', import.meta.url);
const ASSETS = { '/': ['index.html', 'text/html'], '/index.html': ['index.html', 'text/html'], '/login': ['login.html', 'text/html'], '/login.js': ['login.js', 'text/javascript'], '/styles.css': ['styles.css', 'text/css'], '/app.js': ['app.js', 'text/javascript'], '/favicon.svg': ['favicon.svg', 'image/svg+xml'] };
const defaultLogger = (event, fields = {}) => console.log(JSON.stringify({ time: new Date().toISOString(), event, ...fields }));
function json(res, data, status = 200) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); }
export async function createApplication({ config = readConfig(), repository, logger = defaultLogger } = {}) {
  const store = repository || (config.mode === 'postgres' ? new PostgresRepository(config.database, { log: logger }) : new DemoRepository());
  try { await store.init(); } catch (error) { await store.close().catch(() => {}); throw error; }
  const startedAt = Date.now(), clients = new Map(), assets = new Map();
  const limiter = new RateLimiter(config.rateLimit, 60000), loginLimiter = new RateLimiter(10, 900000);
  let shuttingDown = false, loginInFlight = 0;
  async function session(req) {
    if (!config.auth) return { username: 'Local workspace', expiresAt: Infinity };
    const token = sessionToken(req, config);
    const value = token ? await store.getSession(digest(token)) : null;
    return value?.username === config.admin ? value : null;
  }
  function disconnect(res, event) {
    if (event && !res.destroyed) res.write(`event: ${event}\ndata: {}\n\n`);
    clients.delete(res); res.end();
  }
  function broadcast(event, payload) {
    const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const res of clients.keys()) if (!res.write(message)) { clients.delete(res); res.destroy(); }
  }
  store.on('transaction', row => broadcast('transaction', row));
  let refreshTimer;
  store.on('refresh', payload => { if (!refreshTimer) refreshTimer = setTimeout(() => { refreshTimer = null; broadcast('refresh', payload); }, 1000); });
  const server = http.createServer({ maxHeaderSize: 16384, requestTimeout: 15000, headersTimeout: 10000, keepAliveTimeout: 5000 }, async (req, res) => {
    const requestId = randomUUID(), start = Date.now();
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'");
    if (config.production) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    let route = 'invalid';
    res.once('finish', () => logger('http_request', { requestId, method: req.method, route, status: res.statusCode, durationMs: Date.now() - start }));
    try {
      if (shuttingDown) throw new HttpError(503, 'Service is shutting down.');
      if ((req.url || '').length > 2048) throw new HttpError(414, 'Request URL is too long.');
      const url = new URL(req.url, config.origin);
      route = Object.hasOwn(ASSETS, url.pathname) || /^\/(api\/(dashboard|transactions|export|events|health|session|login|logout|ingest)|healthz|readyz)$/.test(url.pathname) ? url.pathname : 'not_found';
      if (req.method === 'GET' && url.pathname === '/healthz') return json(res, { status: 'ok' });
      if (req.method === 'GET' && url.pathname === '/readyz') { const health = await store.health(); return json(res, { status: health.ready ? 'ready' : 'unavailable' }, health.ready ? 200 : 503); }
      const address = config.trustProxy ? String(req.headers['x-forwarded-for'] || req.socket.remoteAddress).split(',').at(-1).trim() : req.socket.remoteAddress;
      if (!limiter.take(address)) { res.setHeader('Retry-After', '60'); throw new HttpError(429, 'Too many requests. Please try again in a minute.'); }
      if (req.method === 'POST' && url.pathname === '/api/login') {
        requireOrigin(req, config);
        if (!config.auth) return json(res, { authenticated: true });
        if (!loginLimiter.take(address)) { res.setHeader('Retry-After', '900'); throw new HttpError(429, 'Too many sign-in attempts. Try again in 15 minutes.'); }
        if (loginInFlight >= 4) throw new HttpError(503, 'Sign-in is busy. Try again shortly.');
        const credentials = await readJSON(req, 4096);
        if (!credentials || typeof credentials.username !== 'string' || credentials.username.length > 80 || typeof credentials.password !== 'string' || credentials.password.length > 256) throw new HttpError(400, 'Invalid sign-in request.');
        loginInFlight++;
        let valid;
        try { valid = await verifyPassword(credentials.password, config.passwordHash); } finally { loginInFlight--; }
        if (!valid || !equal(credentials.username, config.admin)) { logger('login_failed', { requestId }); throw new HttpError(401, 'Incorrect username or password.'); }
        const old = sessionToken(req, config); if (old) await store.deleteSession(digest(old));
        const token = await newSession(store, config); res.setHeader('Set-Cookie', sessionCookie(config, token));
        logger('login_succeeded', { requestId }); return json(res, { authenticated: true, username: config.admin });
      }
      if (req.method === 'POST' && url.pathname === '/api/ingest') {
        if (store.mode !== 'postgres' || !config.ingestKey) throw new HttpError(503, 'Transaction ingestion is not configured.');
        const bearer = String(req.headers.authorization || '');
        if (!bearer.startsWith('Bearer ') || !equal(bearer.slice(7), config.ingestKey)) throw new HttpError(401, 'A valid ingestion token is required.');
        const payload = await readJSON(req);
        const batch = Array.isArray(payload?.transactions) ? payload.transactions : [payload];
        if (!batch.length || batch.length > 100) throw new HttpError(422, 'Submit from 1 to 100 transactions per request.');
        const result = await store.ingest(batch.map(t => normalizeTransaction(t)));
        return json(res, result, result.inserted ? 201 : 200);
      }
      if (req.method === 'GET' && url.pathname === '/api/session') { const user = await session(req); return json(res, { authRequired: config.auth, authenticated: Boolean(user), username: user?.username || null, mode: store.mode }); }
      if (req.method === 'POST' && url.pathname === '/api/logout') {
        requireOrigin(req, config);
        const token = sessionToken(req, config);
        if (token) { await store.deleteSession(digest(token)); for (const [client, meta] of clients) if (meta.tokenHash === digest(token)) disconnect(client, 'unauthorized'); }
        res.setHeader('Set-Cookie', sessionCookie(config)); return json(res, { authenticated: false });
      }
      if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD'); throw new HttpError(405, 'Method not allowed.'); }
      if (url.pathname.startsWith('/api/')) {
        const user = await session(req);
        if (!user) throw new HttpError(401, 'Sign in to access this workspace.');
        if (req.headers['sec-fetch-site'] === 'cross-site') throw new HttpError(403, 'Cross-site requests are not allowed.');
        if (req.method === 'HEAD') throw new HttpError(405, 'Use GET for API requests.');
        if (url.pathname === '/api/health') {
          const health = await store.health();
          return json(res, { name: 'Real-Time E-commerce Data Platform', status: health.ready ? 'ok' : 'unavailable', mode: store.mode, intervalMs: store.mode === 'demo' ? 6500 : null, startedAt: new Date(startedAt).toISOString(), streamConnected: health.streamConnected ?? true, services: [{ name: 'PostgreSQL', status: store.mode === 'postgres' && health.ready ? 'connected' : 'not_connected' }, ...['Kafka', 'Spark', 'dbt', 'Airflow'].map(name => ({ name, status: 'not_monitored' }))] }, health.ready ? 200 : 503);
        }
        if (url.pathname === '/api/events') {
          if (clients.size >= config.streamLimit || [...clients.values()].filter(c => c.address === address).length >= 3) throw new HttpError(429, 'Live connection limit reached. Close another dashboard tab.');
          res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
          res.write(`retry: 5000\nevent: connected\ndata: ${JSON.stringify({ mode: store.mode })}\n\n`);
          const token = sessionToken(req, config);
          clients.set(res, { address, tokenHash: token ? digest(token) : null, expiresAt: user.expiresAt });
          res.once('close', () => clients.delete(res)); return;
        }
        const params = parseQuery(url.searchParams);
        if (url.pathname === '/api/dashboard') return json(res, await store.dashboard(params.range));
        if (url.pathname === '/api/transactions') return json(res, await store.transactions(params));
        if (url.pathname === '/api/export') {
          const { rows, total } = await store.export(params, config.exportLimit);
          if (total > config.exportLimit) throw new HttpError(413, `Export exceeds ${config.exportLimit} rows. Narrow the reporting period or filters.`);
          res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="commerce-transactions-${new Date().toISOString().slice(0, 10)}.csv"`, 'Cache-Control': 'no-store' }); return res.end(toCSV(rows));
        }
        throw new HttpError(404, 'Not found.');
      }
      const asset = ASSETS[url.pathname];
      if (!asset) throw new HttpError(404, 'Not found.');
      if (config.auth && ['/', '/index.html'].includes(url.pathname) && !await session(req)) { res.writeHead(302, { Location: '/login', 'Cache-Control': 'no-store' }); return res.end(); }
      if (!config.production) assets.delete(asset[0]);
      if (!assets.has(asset[0])) { const data = await readFile(new URL(asset[0], publicDir)); assets.set(asset[0], { data, etag: `"${createHash('sha256').update(data).digest('base64url')}"` }); }
      const { data, etag } = assets.get(asset[0]);
      const html = asset[1] === 'text/html';
      res.setHeader('Cache-Control', html ? 'no-store' : 'public, max-age=0, must-revalidate');
      res.setHeader('Content-Type', `${asset[1]}; charset=utf-8`);
      if (!html) { res.setHeader('ETag', etag); if (req.headers['if-none-match'] === etag) { res.writeHead(304); return res.end(); } }
      res.setHeader('Content-Length', data.length); res.writeHead(200); res.end(req.method === 'HEAD' ? undefined : data);
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 503;
      if (!(error instanceof HttpError)) logger('request_failed', { requestId, route, code: /^[A-Z0-9_]{1,20}$/.test(error.code || '') ? error.code : 'INTERNAL' });
      if (res.headersSent) return res.destroy();
      json(res, { error: error instanceof HttpError ? error.message : 'The service is temporarily unavailable.', requestId }, status);
    }
  });
  server.maxRequestsPerSocket = 1000;
  let checking = false;
  const heartbeat = setInterval(async () => {
    if (checking) return; checking = true;
    try {
      for (const [res, meta] of clients) {
        const active = !config.auth || (meta.expiresAt > Date.now() && await store.getSession(meta.tokenHash));
        if (!active) disconnect(res, 'unauthorized');
        else if (!res.write(': heartbeat\n\n')) { clients.delete(res); res.destroy(); }
      }
    } catch { for (const res of clients.keys()) disconnect(res, 'unavailable'); }
    finally { checking = false; }
  }, 15000); heartbeat.unref();
  async function close() {
    if (shuttingDown) return; shuttingDown = true; clearInterval(heartbeat); clearTimeout(refreshTimer);
    for (const res of clients.keys()) disconnect(res, 'shutdown');
    const deadline = setTimeout(() => server.closeAllConnections(), 10000); deadline.unref();
    await new Promise(resolve => { server.close(resolve); server.closeIdleConnections(); });
    clearTimeout(deadline); await store.close();
  }
  return { server, repository: store, close, config };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let app;
  try {
    const config = readConfig(); app = await createApplication({ config });
    await new Promise((resolve, reject) => { app.server.once('error', reject); app.server.listen(config.port, config.host, resolve); });
    defaultLogger('server_started', { host: config.host, port: config.port, mode: config.mode, authentication: config.auth });
    console.log(`Real-Time E-commerce Data Platform: http://localhost:${config.port}`);
    let stopping = false;
    const stop = async () => { if (stopping) return; stopping = true; const deadline = setTimeout(() => process.exit(1), 15000); deadline.unref(); try { await app.close(); process.exitCode = 0; } catch { process.exitCode = 1; } finally { clearTimeout(deadline); } };
    process.on('SIGINT', stop); process.on('SIGTERM', stop);
  } catch { defaultLogger('startup_failed', { message: !app ? 'Configuration or database initialization failed. Check required settings and run migrations.' : 'Unable to bind the configured address.' }); if (app) await app.close(); process.exitCode = 1; }
}
