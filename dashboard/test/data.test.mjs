import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore, dashboard, selectTransactions, parseRange, toCSV } from '../data.mjs';

const now = Date.parse('2026-10-28T12:00:00Z');
const day = 86400000;
const base = { transaction_id: 't-1', order_id: 'ORD-1', customer_name: 'Ava Test', customer_email: 'ava@example.com', customer_id: 'a', product_name: 'Studio Headphones', category: 'Electronics', total_amount: 100, status: 'Completed', timestamp: new Date(now - 1000).toISOString(), payment_method: 'card', country: 'Germany' };
function fixture() {
  return { transactions: [base, { ...base, transaction_id: 't-2', order_id: 'ORD-2', customer_id: 'b', total_amount: 200, status: 'Pending' }, { ...base, transaction_id: 't-3', order_id: 'ORD-3', total_amount: 400, status: 'Failed' }, { ...base, transaction_id: 't-4', timestamp: new Date(now - 8 * day).toISOString(), total_amount: 50 }] };
}
test('revenue and average exclude pending and failed orders; customers are distinct', () => {
  const result = dashboard(fixture(), 7, now);
  assert.deepEqual(result.stats, { revenue: 100, orders: 3, average: 100, customers: 2 });
  assert.equal(result.change.revenue, 100);
  assert.equal(result.series.reduce((sum, p) => sum + p.revenue, 0), result.stats.revenue);
  assert.equal(result.categories.reduce((sum, c) => sum + c.revenue, 0), result.stats.revenue);
});
test('date range, case-insensitive search, status and category filters compose', () => {
  const rows = selectTransactions(fixture(), { range: 7, search: 'AVA', status: 'Pending', category: 'Electronics' }, now);
  assert.equal(rows.length, 1); assert.equal(rows[0].order_id, 'ORD-2');
  assert.equal(selectTransactions(fixture(), { search: 'no match' }, now).length, 0);
  assert.equal(selectTransactions(fixture(), { range: 30 }, now).length, 4);
  assert.equal(selectTransactions(fixture(), { range: 7, sort: 'amount' }, now)[0].total_amount, 400);
});
test('invalid reporting ranges fall back to seven days', () => {
  for (const input of [null, undefined, 'bad', -7, 2, 1000]) assert.equal(parseRange(input), 7);
  for (const input of [1, '7', 30]) assert.equal(parseRange(input), Number(input));
});
test('empty windows produce finite metrics and null comparisons', () => {
  const result = dashboard({ transactions: [] }, 1, now);
  assert.equal(result.stats.average, 0); assert.equal(result.change.revenue, null);
  assert.equal(result.series.length, 12); assert.equal(result.stats.customers, 0);
});
test('seed data spans the comparison periods and live events preserve price arithmetic', () => {
  const store = createStore(now);
  assert.ok(store.transactions.length > 4000);
  assert.ok(dashboard(store, 30, now).change.revenue !== null);
  const transaction = store.addTransaction();
  assert.equal(transaction.total_amount, transaction.quantity * transaction.unit_price);
  assert.equal(store.transactions[0].transaction_id, transaction.transaction_id);
});
test('CSV quotes values and neutralizes spreadsheet formulas', () => {
  const csv = toCSV([{ ...base, customer_name: '=HYPERLINK("evil")', product_name: 'A, "B"' }]);
  assert.ok(csv.startsWith('\ufefforder_id,'));
  assert.ok(csv.includes('"\'=HYPERLINK(""evil"")"'));
  assert.ok(csv.includes('"A, ""B"""'));
  assert.equal(csv.split('\r\n').length, 2);
});
test('CSV protects whitespace-prefixed formulas and leading control characters', () => {
  for (const name of [' =SUM(1,1)', '\n=1+1', '\t=1+1', '@SUM(1,1)']) {
    const csv = toCSV([{ ...base, customer_name: name }]);
    assert.ok(csv.includes('"\'' + name));
  }
});
