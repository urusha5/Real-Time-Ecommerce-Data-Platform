import test from 'node:test';
import assert from 'node:assert/strict';
import { readConfig } from '../config.mjs';
import { hashPassword, verifyPassword, RateLimiter, equal, sessionCookie } from '../security.mjs';
import { normalizeTransaction, parseQuery } from '../validation.mjs';
const good = { transaction_id: 'payment-1', customer_id: 'customer-1', product_name: 'Headphones', category: 'Electronics', quantity: 2, unit_price: 10.25, total_amount: 20.5, payment_method: 'card', country: 'United States', timestamp: '2026-01-01T12:00:00Z' };
test('production configuration fails closed for missing secrets, demo mode and insecure origin', async () => {
  assert.throws(() => readConfig({ NODE_ENV: 'production', DATA_MODE: 'demo' }), /PostgreSQL/);
  assert.throws(() => readConfig({ NODE_ENV: 'production' }), /HTTPS/);
  assert.throws(() => readConfig({ NODE_ENV: 'production', APP_ORIGIN: 'https://commerce.example.com' }), /ADMIN/);
  const hash = await hashPassword('test-only-secure-password');
  const env = { NODE_ENV: 'production', APP_ORIGIN: 'https://commerce.example.com', ADMIN_USERNAME: 'test', ADMIN_PASSWORD_HASH: hash, INGEST_API_KEY: 'a'.repeat(32), DATABASE_URL: 'postgres://test:secret@database/commerce' };
  const config = readConfig(env); assert.equal(config.auth, true); assert.equal(config.mode, 'postgres'); assert.equal(config.database.ssl.rejectUnauthorized, true);
  assert.throws(() => readConfig({ ...env, DATABASE_URL: env.DATABASE_URL + '?sslmode=no-verify' }), /TLS/);
  assert.throws(() => readConfig({ ...env, ADMIN_PASSWORD_HASH_FILE: 'unused' }), /not both/);
  assert.ok(sessionCookie(config, 'token').includes('__Host-')); assert.ok(sessionCookie(config, 'token').includes('; Secure'));
});
test('passwords use salted scrypt hashes and verification rejects incorrect values', async () => {
  const hash = await hashPassword('test-only-secure-password');
  assert.notEqual(hash, await hashPassword('test-only-secure-password'));
  assert.equal(await verifyPassword('test-only-secure-password', hash), true);
  assert.equal(await verifyPassword('wrong-password', hash), false);
  assert.throws(() => readConfig({ PORT: '-1' }), /PORT/);
  assert.equal(equal('a', 'a'), true); assert.equal(equal('a', 'b'), false);
});
test('rate limiting has bounded keys, expires windows and rejects excess traffic', () => {
  const limiter = new RateLimiter(2, 1000, 2);
  assert.equal(limiter.take('a', 0), true); assert.equal(limiter.take('a', 0), true); assert.equal(limiter.take('a', 0), false);
  assert.equal(limiter.take('b', 0), true); assert.equal(limiter.take('c', 0), false); assert.equal(limiter.take('c', 1001), true);
});
test('ingestion validates exact monetary arithmetic, timestamps, status and personal fields', () => {
  const normalized = normalizeTransaction(good); assert.equal(normalized.status, 'Completed'); assert.equal(normalized.timestamp, new Date(good.timestamp).toISOString());
  assert.equal(normalizeTransaction({ ...good, timestamp: '2026-01-01T12:00:00' }).timestamp, new Date(good.timestamp).toISOString());
  for (const patch of [{ total_amount: 21 }, { unit_price: NaN }, { quantity: 0 }, { status: 'Paid' }, { payment_method: 'crypto' }, { timestamp: 'not-a-date' }, { timestamp: '2026-02-31T12:00:00Z' }, { customer_email: 'invalid' }, { product_name: '\u0000broken' }, { quantity: '2' }]) assert.throws(() => normalizeTransaction({ ...good, ...patch }), /Invalid|must|outside/);
  assert.throws(() => normalizeTransaction(null));
});
test('query validation rejects ambiguity, invalid filters and oversized input', () => {
  for (const query of ['range=2', 'range=7&range=1', 'foo=bar', 'page=-1', 'status=Other', 'sort=arbitrary', `search=${'a'.repeat(101)}`]) assert.throws(() => parseQuery(new URLSearchParams(query)));
  assert.equal(parseQuery(new URLSearchParams('range=30&page=2')).range, '30');
});
