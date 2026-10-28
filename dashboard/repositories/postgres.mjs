import { EventEmitter } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { HttpError } from '../security.mjs';
import { presentation } from '../validation.mjs';

const DAY = 86400000;
export const MIGRATIONS = ['001_initial.sql'];
export async function migrate(pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // A transaction-level lock serializes migrations across concurrent deploys.
    await client.query('SELECT pg_advisory_xact_lock(82370461)');
    await client.query('CREATE TABLE IF NOT EXISTS commerce_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
    for (const name of MIGRATIONS) {
      if (!(await client.query('SELECT name FROM commerce_migrations WHERE name = $1', [name])).rows.length) {
        await client.query(await readFile(new URL(`../migrations/${name}`, import.meta.url), 'utf8'));
        await client.query('INSERT INTO commerce_migrations(name) VALUES ($1)', [name]);
      }
    }
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK').catch(() => {}); throw error; }
  finally { client.release(); }
}
const revenueSQL = "COALESCE(SUM(total_amount) FILTER (WHERE status = 'Completed'), 0)::float8";
const statsSQL = `SELECT ${revenueSQL} AS revenue, COUNT(*)::int AS orders, COUNT(DISTINCT customer_id)::int AS customers, COALESCE(AVG(total_amount) FILTER (WHERE status = 'Completed'), 0)::float8 AS average FROM commerce_transactions WHERE created_at >= $1 AND created_at < $2`;
function mapRow(row) { return { ...row, product_id: row.product_id === null ? null : Number(row.product_id), unit_price: Number(row.unit_price), total_amount: Number(row.total_amount), timestamp: new Date(row.created_at).toISOString(), ...presentation(row.category) }; }
export function filters(params, now = Date.now()) {
  const values = [new Date(now - Number(params.range || 7) * DAY), new Date(now)];
  const clauses = ['created_at >= $1', 'created_at < $2'];
  if (params.status) { values.push(params.status); clauses.push(`status = $${values.length}`); }
  if (params.category) { values.push(params.category); clauses.push(`category = $${values.length}`); }
  if (params.search) {
    // Escape LIKE wildcards so search has the same literal semantics as demo mode.
    values.push(`%${params.search.replace(/[\\%_]/g, '\\$&')}%`);
    clauses.push(`(order_id ILIKE $${values.length} OR customer_name ILIKE $${values.length} OR customer_email ILIKE $${values.length} OR product_name ILIKE $${values.length} OR country ILIKE $${values.length} OR category ILIKE $${values.length})`);
  }
  const order = params.sort === 'amount' ? 'total_amount DESC, created_at DESC, transaction_id' : params.sort === 'oldest' ? 'created_at ASC, transaction_id' : 'created_at DESC, transaction_id';
  return { where: clauses.join(' AND '), values, order };
}
export class PostgresRepository extends EventEmitter {
  constructor(database, { pool, listen = true, log = () => {} } = {}) { super(); this.database = database; this.pool = pool; this.listenEnabled = listen; this.log = log; this.mode = 'postgres'; this.stopped = false; this.listening = false; }
  async init() {
    if (!this.pool) {
      const { Pool } = await import('pg');
      this.pool = new Pool(this.database);
      this.pool.on('error', () => this.log('database_pool_error', { status: 'unavailable' }));
    }
    // Migrations run as a separate deploy step; the app has no DDL privileges.
    await this.pool.query('SELECT transaction_id FROM commerce_transactions LIMIT 0');
    if (this.listenEnabled) await this.connectListener();
  }
  async connectListener() {
    if (this.stopped) return;
    const { Client } = await import('pg');
    const client = new Client(this.database);
    this.listener = client;
    let failed = false;
    const recover = () => {
      if (failed || this.stopped) return; failed = true; this.listening = false;
      this.log('database_listener_disconnected', { status: 'retrying' });
      client.end().catch(() => {});
      this.reconnect = setTimeout(() => this.connectListener().catch(() => {}), 5000); this.reconnect.unref();
    };
    client.on('error', recover); client.on('end', recover);
    client.on('notification', () => { this.cache = null; this.emit('refresh', { mode: this.mode }); });
    try { await client.connect(); await client.query('LISTEN commerce_changed'); this.listening = true; this.emit('refresh', { mode: this.mode }); }
    catch (error) { recover(); throw error; }
  }
  async health() {
    try { await this.pool.query('SELECT transaction_id FROM commerce_transactions LIMIT 0'); return { ready: !this.stopped, mode: this.mode, streamConnected: this.listening }; }
    catch { return { ready: false, mode: this.mode, streamConnected: false }; }
  }
  async dashboard(range = 7, now = Date.now()) {
    const days = Number(range), start = now - days * DAY, previousStart = start - days * DAY;
    if (this.cache?.range === days && now - this.cache.createdAt < 3000) return this.cache.result;
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const currentValues = [new Date(start), new Date(now)], previousValues = [new Date(previousStart), new Date(start)];
      const stats = (await client.query(statsSQL, currentValues)).rows[0];
      const before = (await client.query(statsSQL, previousValues)).rows[0];
      const buckets = days === 1 ? 12 : days, interval = days * DAY / buckets;
      const series = [];
      // At most 30 buckets. SQL aggregation keeps transaction rows out of app memory.
      const seriesResult = await client.query(`SELECT FLOOR((EXTRACT(EPOCH FROM created_at) * 1000 - $1::float8) / $2::float8)::int AS bucket, ${revenueSQL} AS revenue, COUNT(*)::int AS orders, COUNT(DISTINCT customer_id)::int AS customers, COALESCE(AVG(total_amount) FILTER (WHERE status='Completed'),0)::float8 AS average FROM commerce_transactions WHERE created_at >= $3 AND created_at < $4 GROUP BY bucket`, [previousStart, interval, new Date(previousStart), new Date(now)]);
      const grouped = new Map(seriesResult.rows.map(row => [row.bucket, row]));
      for (let i = 0; i < buckets; i++) { const current = grouped.get(i + buckets) || { revenue: 0, orders: 0, customers: 0, average: 0 }; series.push({ timestamp: new Date(start + (i + 1) * interval).toISOString(), revenue: current.revenue, orders: current.orders, customers: current.customers, average: current.average, previous: grouped.get(i)?.revenue || 0 }); }
      const categories = (await client.query(`SELECT category AS name, ${revenueSQL} AS revenue FROM commerce_transactions WHERE created_at >= $1 AND created_at < $2 GROUP BY category ORDER BY revenue DESC, category LIMIT 100`, currentValues)).rows;
      const products = (await client.query(`SELECT product_name AS name, category, ${revenueSQL} AS revenue, COALESCE(SUM(quantity) FILTER (WHERE status='Completed'),0)::int AS units FROM commerce_transactions WHERE created_at >= $1 AND created_at < $2 GROUP BY product_name, category ORDER BY revenue DESC, product_name LIMIT 100`, currentValues)).rows.map(p => ({ ...p, ...presentation(p.category) }));
      const countries = (await client.query(`SELECT country AS name, ${revenueSQL} AS revenue, COUNT(*)::int AS orders FROM commerce_transactions WHERE created_at >= $1 AND created_at < $2 GROUP BY country ORDER BY revenue DESC, country LIMIT 250`, currentValues)).rows;
      const payments = (await client.query('SELECT payment_method AS name, COUNT(*)::int AS orders FROM commerce_transactions WHERE created_at >= $1 AND created_at < $2 GROUP BY payment_method ORDER BY orders DESC', currentValues)).rows;
      const counts = (await client.query('SELECT status, COUNT(*)::int AS count FROM commerce_transactions WHERE created_at >= $1 AND created_at < $2 GROUP BY status', currentValues)).rows;
      const totalRecords = Number((await client.query('SELECT COUNT(*) AS count FROM commerce_transactions')).rows[0].count);
      await client.query('COMMIT');
      const change = Object.fromEntries(Object.keys(stats).map(key => [key, before[key] ? (stats[key] - before[key]) / before[key] * 100 : null]));
      const result = { mode: this.mode, generatedAt: new Date(now).toISOString(), days, stats, change, series, categories, products, countries, payments, statusCounts: { Completed: 0, Pending: 0, Failed: 0, ...Object.fromEntries(counts.map(row => [row.status, row.count])) }, totalRecords };
      this.cache = { range: days, createdAt: now, result }; return result;
    } catch (error) { await client.query('ROLLBACK').catch(() => {}); throw error; }
    finally { client.release(); }
  }
  async transactions(params, now = Date.now()) {
    const { where, values, order } = filters(params, now), pageSize = 8;
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const total = Number((await client.query(`SELECT COUNT(*) AS count FROM commerce_transactions WHERE ${where}`, values)).rows[0].count);
      const pages = Math.ceil(total / pageSize) || 1, page = Math.min(pages, Math.max(1, Number(params.page) || 1));
      const rows = (await client.query(`SELECT * FROM commerce_transactions WHERE ${where} ORDER BY ${order} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [...values, pageSize, (page - 1) * pageSize])).rows.map(mapRow);
      await client.query('COMMIT'); return { rows, total, pages, page, pageSize };
    } catch (error) { await client.query('ROLLBACK').catch(() => {}); throw error; }
    finally { client.release(); }
  }
  async export(params, limit) {
    const { where, values, order } = filters(params);
    const rows = (await this.pool.query(`SELECT * FROM commerce_transactions WHERE ${where} ORDER BY ${order} LIMIT $${values.length + 1}`, [...values, limit + 1])).rows.map(mapRow);
    return { rows: rows.slice(0, limit), total: rows.length };
  }
  async ingest(transactions) {
    const client = await this.pool.connect(); let inserted = 0;
    try {
      await client.query('BEGIN');
      for (const t of transactions) {
        const fields = ['transaction_id', 'order_id', 'customer_id', 'customer_name', 'customer_email', 'product_id', 'product_name', 'category', 'quantity', 'unit_price', 'total_amount', 'payment_method', 'country', 'status'];
        const hash = createHash('sha256').update(JSON.stringify(t)).digest('hex');
        const values = [...fields.map(key => t[key]), t.timestamp, hash];
        const result = await client.query(`INSERT INTO commerce_transactions (${fields.join(',')}, created_at, payload_hash) VALUES (${values.map((_, i) => '$' + (i + 1)).join(',')}) ON CONFLICT (transaction_id) DO NOTHING RETURNING transaction_id`, values);
        if (result.rows.length) inserted++;
        else {
          const existing = (await client.query('SELECT payload_hash FROM commerce_transactions WHERE transaction_id=$1', [t.transaction_id])).rows[0];
          if (existing.payload_hash !== hash) throw new HttpError(409, 'The transaction ID already exists with different data.');
        }
      }
      if (inserted) await client.query("SELECT pg_notify('commerce_changed', '')");
      await client.query('COMMIT'); this.cache = null; return { inserted, duplicates: transactions.length - inserted };
    } catch (error) { await client.query('ROLLBACK').catch(() => {}); throw error; }
    finally { client.release(); }
  }
  async putSession(id, session) { await this.pool.query('DELETE FROM commerce_sessions WHERE expires_at <= NOW()'); await this.pool.query('INSERT INTO commerce_sessions(token_hash,username,expires_at) VALUES($1,$2,$3)', [id, session.username, new Date(session.expiresAt)]); }
  async getSession(id) { const row = (await this.pool.query('SELECT username, expires_at FROM commerce_sessions WHERE token_hash=$1 AND expires_at > NOW()', [id])).rows[0]; return row ? { username: row.username, expiresAt: new Date(row.expires_at).getTime() } : null; }
  async deleteSession(id) { await this.pool.query('DELETE FROM commerce_sessions WHERE token_hash=$1', [id]); }
  async deadLetter({ topic, partition, offset, payload, reason }) { await this.pool.query('INSERT INTO commerce_dead_letters(topic,partition_id,message_offset,payload,reason) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING', [topic, partition, offset, payload.slice(0, 131072), reason.slice(0, 300)]); }
  async close() { this.stopped = true; clearTimeout(this.reconnect); await this.listener?.end().catch(() => {}); await this.pool?.end(); this.removeAllListeners(); }
}
