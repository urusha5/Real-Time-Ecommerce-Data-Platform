import test from 'node:test';
import assert from 'node:assert/strict';
import { testDatabase } from './helpers/database.mjs';
import { normalizeTransaction } from '../validation.mjs';
import { migrate } from '../repositories/postgres.mjs';
const { repository, pool } = await testDatabase();
test.after(() => repository.close());
const now = Date.now(), day = 86400000;
const input = { transaction_id: 'pg-1', order_id: 'ORDER-1', customer_id: 'one', customer_name: 'Ava Test', customer_email: 'ava@example.com', product_id: 123, product_name: 'Custom Headphones', category: 'Electronics', quantity: 2, unit_price: 10.25, total_amount: 20.5, payment_method: 'card', country: 'Japan', timestamp: new Date(now - 1000).toISOString() };
test('migrations are idempotent and immutable events are exactly deduplicated', async () => {
  await migrate(pool);
  const row = normalizeTransaction(input);
  assert.deepEqual(await repository.ingest([row]), { inserted: 1, duplicates: 0 });
  assert.deepEqual(await repository.ingest([row]), { inserted: 0, duplicates: 1 });
  await assert.rejects(repository.ingest([{ ...row, customer_name: 'different' }]), error => error.status === 409);
  assert.equal((await pool.query('SELECT COUNT(*)::int AS count FROM commerce_transactions')).rows[0].count, 1);
});
test('SQL aggregations, buckets, products and countries agree on exact revenue', async () => {
  await repository.ingest([normalizeTransaction({ ...input, transaction_id: 'pg-2', customer_id: 'two', status: 'Pending' }), normalizeTransaction({ ...input, transaction_id: 'pg-3', timestamp: new Date(now - 8 * day).toISOString() })]);
  const result = await repository.dashboard(7, now);
  assert.equal(result.mode, 'postgres'); assert.equal(result.stats.revenue, 20.5); assert.equal(result.stats.average, 20.5); assert.equal(result.stats.orders, 2); assert.equal(result.stats.customers, 2);
  assert.equal(result.change.revenue, 0); assert.equal(result.series.reduce((n, p) => n + p.revenue, 0), 20.5);
  assert.equal(result.products[0].name, input.product_name); assert.equal(result.products[0].units, 2); assert.equal(result.countries[0].name, 'Japan');
});
test('SQL filtering treats search metacharacters literally and resists injection', async () => {
  assert.equal((await repository.transactions({ range: 7, search: 'AVA' }, now)).total, 2);
  assert.equal((await repository.transactions({ range: 7, search: '%' }, now)).total, 0);
  assert.equal((await repository.transactions({ range: 7, search: "' OR TRUE; --" }, now)).total, 0);
  assert.equal((await repository.transactions({ range: 7, status: 'Pending', category: 'Electronics' }, now)).total, 1);
  const exported = await repository.export({ range: 30 }, 1); assert.equal(exported.rows.length, 1); assert.equal(exported.total, 2);
});
test('batch conflicts roll back all inserts, avoiding partial ingestion', async () => {
  const fresh = normalizeTransaction({ ...input, transaction_id: 'rolled-back' });
  await assert.rejects(repository.ingest([fresh, normalizeTransaction({ ...input, customer_name: 'conflict' })]));
  assert.equal((await pool.query('SELECT transaction_id FROM commerce_transactions WHERE transaction_id=$1', ['rolled-back'])).rows.length, 0);
});
test('sessions persist and revoke; poison events are quarantined idempotently', async () => {
  await repository.putSession('a'.repeat(64), { username: 'operator', expiresAt: Date.now() + 60000 });
  assert.equal((await repository.getSession('a'.repeat(64))).username, 'operator'); await repository.deleteSession('a'.repeat(64)); assert.equal(await repository.getSession('a'.repeat(64)), null);
  await repository.putSession('b'.repeat(64), { username: 'operator', expiresAt: Date.now() - 1000 }); assert.equal(await repository.getSession('b'.repeat(64)), null);
  const message = { topic: 'test', partition: 0, offset: '1', payload: 'invalid', reason: 'Invalid JSON' };
  await repository.deadLetter(message); await repository.deadLetter(message);
  assert.equal((await pool.query('SELECT COUNT(*)::int AS count FROM commerce_dead_letters')).rows[0].count, 1);
});
