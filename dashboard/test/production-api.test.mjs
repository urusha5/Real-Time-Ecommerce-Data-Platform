import test from 'node:test';
import assert from 'node:assert/strict';
import { createApplication } from '../server.mjs';
import { readConfig } from '../config.mjs';
import { hashPassword } from '../security.mjs';
import { testDatabase } from './helpers/database.mjs';
const { repository } = await testDatabase();
const password = 'test-only-long-password', origin = 'https://commerce.example.com', key = 'test-ingestion-token-'.repeat(3), logs = [];
const config = readConfig({ NODE_ENV: 'production', APP_ORIGIN: origin, ADMIN_USERNAME: 'operator', ADMIN_PASSWORD_HASH: await hashPassword(password), INGEST_API_KEY: key, DATABASE_URL: 'postgres://unused@database/commerce', MAX_STREAMS: '2', EXPORT_LIMIT: '1' });
const app = await createApplication({ config, repository, logger: (event, fields) => logs.push({ event, ...fields }) });
await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${app.server.address().port}`;
test.after(() => app.close());
async function login() {
  const response = await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify({ username: 'operator', password }) });
  assert.equal(response.status, 200);
  const cookie = response.headers.get('set-cookie');
  assert.ok(cookie.includes('Secure')); assert.ok(cookie.includes('HttpOnly')); assert.ok(cookie.includes('SameSite=Strict'));
  return cookie.split(';')[0];
}
const transaction = { transaction_id: 'api-1', customer_id: 'customer-1', customer_name: 'Test User', product_name: 'Custom Product', category: 'Other category', quantity: 1, unit_price: 19.99, total_amount: 19.99, payment_method: 'card', country: 'Canada', timestamp: new Date(Date.now() - 1000).toISOString() };
test('unauthenticated users cannot read analytics, exports or event streams', async () => {
  for (const route of ['/api/dashboard', '/api/transactions', '/api/export', '/api/events', '/api/health']) assert.equal((await fetch(base + route)).status, 401, route);
  const redirect = await fetch(base + '/', { redirect: 'manual' }); assert.equal(redirect.status, 302); assert.equal(redirect.headers.get('location'), '/login');
  assert.equal((await fetch(base + '/login')).status, 200);
  const session = await (await fetch(base + '/api/session')).json(); assert.equal(session.authenticated, false); assert.equal(session.authRequired, true);
});
test('login rejects cross-origin and incorrect credentials; valid sessions can be revoked', async () => {
  const body = JSON.stringify({ username: 'operator', password });
  assert.equal((await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://attacker.invalid' }, body })).status, 403);
  assert.equal((await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify({ username: 'operator', password: 'wrong' }) })).status, 401);
  const cookie = await login();
  assert.equal((await fetch(base + '/api/dashboard', { headers: { Cookie: cookie } })).status, 200);
  assert.equal((await fetch(base + '/api/logout', { method: 'POST', headers: { Cookie: cookie, Origin: 'https://attacker.invalid' } })).status, 403);
  assert.equal((await fetch(base + '/api/logout', { method: 'POST', headers: { Cookie: cookie, Origin: origin } })).status, 200);
  assert.equal((await fetch(base + '/api/dashboard', { headers: { Cookie: cookie } })).status, 401);
});
test('protected ingestion persists real data, deduplicates retries and rejects invalid or conflicting events', async () => {
  const request = (value, token = key) => fetch(base + '/api/ingest', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(value) });
  assert.equal((await request(transaction, 'wrong-token')).status, 401);
  assert.equal((await request({ ...transaction, total_amount: 0 })).status, 422);
  const first = await request(transaction); assert.equal(first.status, 201); assert.equal((await first.json()).inserted, 1);
  const duplicate = await request(transaction); assert.equal(duplicate.status, 200); assert.equal((await duplicate.json()).duplicates, 1);
  assert.equal((await request({ ...transaction, customer_name: 'Conflicting name' })).status, 409);
  const cookie = await login();
  const metrics = await (await fetch(base + '/api/dashboard', { headers: { Cookie: cookie } })).json(); assert.equal(metrics.mode, 'postgres'); assert.equal(metrics.stats.revenue, 19.99);
  const exported = await (await fetch(base + '/api/export', { headers: { Cookie: cookie } })).text(); assert.ok(exported.includes('Custom Product'));
});
test('request limits, security headers, validation, ETags and readiness behave predictably', async () => {
  const cookie = await login();
  for (const query of ['range=99', 'search=a&search=b', 'page=-1', 'status=Paid']) assert.equal((await fetch(base + '/api/transactions?' + query, { headers: { Cookie: cookie } })).status, 400);
  const oversized = await fetch(base + '/api/ingest', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: 'a'.repeat(140000) }); assert.equal(oversized.status, 413);
  const response = await fetch(base + '/styles.css'); assert.ok(response.headers.get('strict-transport-security')); assert.ok(response.headers.get('content-security-policy').includes("frame-ancestors 'none'")); assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal((await fetch(base + '/styles.css', { headers: { 'If-None-Match': response.headers.get('etag') } })).status, 304);
  const healthy = repository.health; repository.health = async () => ({ ready: false });
  assert.equal((await fetch(base + '/readyz')).status, 503); assert.equal((await fetch(base + '/healthz')).status, 200); repository.health = healthy;
  const original = repository.transactions; repository.transactions = async () => { throw new Error('password=should-never-leak'); };
  const unavailable = await fetch(base + '/api/transactions', { headers: { Cookie: cookie } }); assert.equal(unavailable.status, 503); assert.ok(!(await unavailable.text()).includes('should-never-leak')); repository.transactions = original;
});
test('SSE limits prevent connection exhaustion and logout closes the authenticated stream', async () => {
  const cookie = await login(), abort1 = new AbortController(), abort2 = new AbortController();
  const response1 = await fetch(base + '/api/events', { headers: { Cookie: cookie }, signal: abort1.signal });
  const response2 = await fetch(base + '/api/events', { headers: { Cookie: cookie }, signal: abort2.signal });
  const reader = response1.body.getReader(); await reader.read();
  assert.equal((await fetch(base + '/api/events', { headers: { Cookie: cookie } })).status, 429);
  await fetch(base + '/api/logout', { method: 'POST', headers: { Cookie: cookie, Origin: origin } });
  const revoked = new TextDecoder().decode((await reader.read()).value); assert.ok(revoked.includes('event: unauthorized'));
  abort1.abort(); abort2.abort(); await response2.body.cancel().catch(() => {});
});
test('structured logs exclude passwords, tokens, email searches and raw database errors', () => {
  const output = JSON.stringify(logs);
  for (const secret of [password, key, 'should-never-leak', 'test-ingestion-token']) assert.ok(!output.includes(secret));
  assert.ok(logs.some(log => log.event === 'login_succeeded')); assert.ok(logs.some(log => log.requestId));
});
test('exports reject excessive rows instead of silently truncating a report', async () => {
  await fetch(base + '/api/ingest', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify({ ...transaction, transaction_id: 'api-2' }) });
  const cookie = await login();
  const response = await fetch(base + '/api/export', { headers: { Cookie: cookie } });
  assert.equal(response.status, 413); assert.ok((await response.json()).error.includes('Narrow'));
});
test('repeated failed sign-ins are rate limited through the actual HTTP endpoint', async () => {
  let response;
  for (let i = 0; i < 11; i++) response = await fetch(base + '/api/login', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'operator', password: 'incorrect' }) });
  assert.equal(response.status, 429); assert.equal(response.headers.get('retry-after'), '900');
});
