import test from 'node:test';
import assert from 'node:assert/strict';
import { createApplication } from '../server.mjs';
import { readConfig } from '../config.mjs';
const app = await createApplication({ config: readConfig({ NODE_ENV: 'test' }), logger: () => {} });
const { server } = app;

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
test.after(() => app.close());
test('serves the dashboard and all local assets', async () => {
  for (const [path, type] of [['/', 'text/html'], ['/styles.css', 'text/css'], ['/app.js', 'text/javascript'], ['/favicon.svg', 'image/svg+xml']]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200, path);
    assert.ok(response.headers.get('content-type').includes(type));
    assert.ok((await response.text()).length > 100);
  }
});
test('API metrics, pagination and export agree on filtered records', async () => {
  const dashboard = await (await fetch(origin + '/api/dashboard?range=7')).json();
  const transactions = await (await fetch(origin + '/api/transactions?range=7')).json();
  assert.equal(transactions.total, dashboard.stats.orders);
  assert.equal(transactions.rows.length, 8);
  const filtered = await (await fetch(origin + '/api/transactions?range=7&status=Pending&search=olivia')).json();
  assert.ok(filtered.rows.every(row => row.status === 'Pending' && row.customer_name.toLowerCase().includes('olivia')));
  const csvResponse = await fetch(origin + '/api/export?range=7&status=Pending&search=olivia');
  assert.ok(csvResponse.headers.get('content-disposition').includes('.csv'));
  assert.equal((await csvResponse.text()).split('\r\n').length - 1, filtered.total);
  const page = await (await fetch(origin + '/api/transactions?page=9999999')).json();
  assert.equal(page.page, page.pages);
});
test('health reports demo mode without claiming external connections', async () => {
  const health = await (await fetch(origin + '/api/health')).json();
  assert.equal(health.mode, 'demo');
  assert.ok(health.services.every(service => service.status !== 'connected'));
});
test('protects private project files and handles missing paths', async () => {
  for (const path of ['/.env', '/%2e%2e%5c.env', '/missing.js', '/api/missing']) {
    const response = await fetch(origin + path); assert.equal(response.status, 404, path);
  }
  const response = await fetch(origin + '/api/health', { method: 'POST' });
  assert.equal(response.status, 405);
});
test('event stream establishes an explicit demo connection', async () => {
  const abort = new AbortController();
  const response = await fetch(origin + '/api/events', { signal: abort.signal });
  assert.ok(response.headers.get('content-type').includes('text/event-stream'));
  const reader = response.body.getReader();
  const first = await reader.read();
  const text = new TextDecoder().decode(first.value);
  assert.ok(text.includes('event: connected')); assert.ok(text.includes('"mode":"demo"'));
  abort.abort(); await reader.cancel().catch(() => {});
});
