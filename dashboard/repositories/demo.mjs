import { EventEmitter } from 'node:events';
import { createStore, dashboard, selectTransactions } from '../data.mjs';
export class DemoRepository extends EventEmitter {
  constructor({ intervalMs = 6500 } = {}) { super(); this.mode = 'demo'; this.store = createStore(); this.sessions = new Map(); this.intervalMs = intervalMs; }
  async init() {
    this.timer = setInterval(() => { const row = this.store.addTransaction(); this.emit('transaction', row); }, this.intervalMs); this.timer.unref();
  }
  async dashboard(range) { return dashboard(this.store, range); }
  async transactions(params) {
    const rows = selectTransactions(this.store, params), pageSize = 8, pages = Math.ceil(rows.length / pageSize) || 1;
    const page = Math.min(pages, Math.max(1, Number(params.page) || 1));
    return { rows: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length, page, pageSize, pages };
  }
  async export(params, limit) { const rows = selectTransactions(this.store, params); return { rows: rows.slice(0, limit), total: rows.length }; }
  async health() { return { ready: true, mode: this.mode, records: this.store.transactions.length }; }
  async putSession(id, session) { for (const [key, value] of this.sessions) if (value.expiresAt <= Date.now()) this.sessions.delete(key); this.sessions.set(id, session); }
  async getSession(id) { const session = this.sessions.get(id); return session?.expiresAt > Date.now() ? session : null; }
  async deleteSession(id) { this.sessions.delete(id); }
  async close() { clearInterval(this.timer); this.sessions.clear(); this.removeAllListeners(); }
}
