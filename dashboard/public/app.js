'use strict';

const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  chart: '<path d="M4 3v17h17M8 15l4-5 4 3 5-7"/>',
  arrows: '<path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4 4-4-4 4-4"/>',
  workflow: '<rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="15" y="15" width="6" height="6" rx="1.5"/><path d="M6 9v9h9M9 6h9v9"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>',
  settings: '<path d="m9 3-.5 2.2-2 .9-2-.8-2 3.4 1.7 1.5v2.4L2.5 14l2 3.4 2-.7 2 .9L9 20h4l.5-2.3 2-.9 2 .7 2-3.4-1.7-1.4v-2.4l1.7-1.5-2-3.4-2 .8-2-.9L13 3z"/><circle cx="11" cy="11.5" r="3"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4M12 17h.01"/>',
  sparkles: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM20 2v4m-2-2h4"/>',
  'arrow-right': '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  'arrow-up': '<path d="M7 17 17 7M7 7h10v10"/>',
  'arrow-down': '<path d="m7 7 10 10M7 17h10V7"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'chevron-left': '<path d="m14 6-6 6 6 6"/>',
  'chevron-right': '<path d="m10 6 6 6-6 6"/>',
  chevrons: '<path d="m9 8 3-3 3 3m-6 8 3 3 3-3"/>',
  external: '<path d="M14 3h7v7m0-7L10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/>',
  panels: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  moon: '<path d="M20.9 13.5A9 9 0 0 1 10.5 3.1a9 9 0 1 0 10.4 10.4Z"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 15h2m4 0h2"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  wallet: '<path d="M20 8V5a2 2 0 0 0-2-2L5 6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h15V8H5M20 12h-5v5h5m-3-2.5h.01"/>',
  bag: '<path d="M5 8h14l2 13H3L5 8Zm3 0V6a4 4 0 0 1 8 0v2"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v3"/>',
  cart: '<path d="M2 3h3l3 12h10l3-8H6M9 20h.01M18 20h.01"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
  dots: '<circle cx="5" cy="12" r=".7"/><circle cx="12" cy="12" r=".7"/><circle cx="19" cy="12" r=".7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
  headphones: '<path d="M4 14v-3a8 8 0 0 1 16 0v3M4 13H3v7h4v-7H4Zm16 0h1v7h-4v-7h3Z"/>',
  shoe: '<path d="m7 5 3 6 5 2 5 1 1 5H3v-6l4-8Zm3 6-3 2m6-1-2 3m5-2-2 3M3 17h18"/>',
  coffee: '<path d="M4 8h13v8a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Zm13 1h2a3 3 0 0 1 0 6h-2M7 2v2m4-2v2m4-2v2"/>',
  watch: '<rect x="6" y="7" width="12" height="10" rx="3"/><path d="m8 7 1-5h6l1 5m-8 10 1 5h6l1-5m-4-7v3h3"/>',
  bottle: '<path d="M9 2h6v4H9zM9 6v3l-3 3v9h12v-9l-3-3V6M6 14h12"/>',
  book: '<path d="M3 3h7a2 2 0 0 1 2 2v16a3 3 0 0 0-3-2H3V3Zm18 0h-7a2 2 0 0 0-2 2v16a3 3 0 0 1 3-2h6V3Z"/>',
  layers: '<path d="m12 3 10 5-10 5L2 8l10-5Zm-9 9 9 5 9-5m-18 5 9 5 9-5"/>',
  lamp: '<path d="m8 3-5 9h14l-5-9H8Zm2 9v9m-5 0h10m2-9 4 5"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  pause: '<path d="M8 4v16M16 4v16"/>',
  play: '<path d="m8 4 12 8-12 8V4Z"/>',
  activity: '<path d="M2 12h5l3-9 4 18 3-9h5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  code: '<path d="m7 6-6 6 6 6m10-12 6 6-6 6M14 3l-4 18"/>',
  server: '<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  card: '<rect x="2" y="4" width="20" height="16" rx="3"/><path d="M2 9h20M6 15h3"/>',
  bank: '<path d="m12 2 10 5H2l10-5ZM2 21h20M5 10v8m7-8v8m7-8v8"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/>',
};
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const icon = (name, extra = '') => `<svg class="icon ${extra}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.grid}</svg>`;
function mountIcons(root = document) { $$('[data-icon]', root).forEach(el => { el.innerHTML = icon(el.dataset.icon); }); }
const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const money = (value, decimals = 0) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
const number = value => new Intl.NumberFormat('en-US').format(value);
const time = value => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
const date = value => new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' });
const initials = name => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
function readPreference(key, fallback) { try { return localStorage.getItem(`commerce-${key}`) || fallback; } catch { return fallback; } }
function savePreference(key, value) { try { localStorage.setItem(`commerce-${key}`, value); } catch { /* Preferences remain usable in memory. */ } }
const state = {
  page: 'overview', mode: 'demo', health: null, authRequired: false, range: [1, 7, 30].includes(Number(readPreference('range', 7))) ? Number(readPreference('range', 7)) : 7,
  data: null, transactions: null, search: '', status: '', category: '', sort: 'newest', tablePage: 1,
  paused: readPreference('paused', 'false') === 'true', connected: false, stream: null, chart: 'daily',
  name: readPreference('name', 'Habib Lawal'), workspace: readPreference('workspace', 'E-commerce workspace'),
  logs: [], notifications: [], request: 0, refreshRequest: 0, toastTimeout: null,
};
const PAGES = {
  overview: ['YOUR BUSINESS, IN FOCUS', 'Overview', 'A little perspective on everything happening in your store.'],
  analytics: ['FROM NUMBERS TO KNOWING', 'Analytics', 'Find the products, places, and patterns moving your business forward.'],
  transactions: ['EVERY ORDER TELLS A STORY', 'Transactions', 'A closer look at the activity flowing through your store.'],
  pipeline: ['BEHIND EVERY INSIGHT', 'Data pipeline', 'Follow the journey from a new event to a useful insight.'],
  warehouse: ['A HOME FOR YOUR DATA', 'Warehouse', 'Understand the structure behind your commerce data.'],
  settings: ['MAKE YOURSELF AT HOME', 'Settings', 'A workspace that works the way you do.'],
};
const isDemo = () => state.mode === 'demo';
const modeText = (demo, live) => isDemo() ? demo : live;
const COLORS = ['#2e8b6f', '#80b296', '#b1cbb6', '#d6e3ce', '#a4b3c3', '#d8c4a7', '#d6c4d5'];
const PAYMENT_NAMES = { card: 'Credit & debit cards', bank_transfer: 'Bank transfer', mobile_money: 'Mobile money', cash: 'Cash' };
function changeBadge(value, pill = false) {
  if (value === null || !Number.isFinite(value)) return '<span class="change">No previous data</span>';
  return `<span class="change ${value < 0 ? 'negative' : ''}${pill ? ' change-pill' : ''}">${icon(value < 0 ? 'arrow-down' : 'arrow-up')}${Math.abs(value).toFixed(1)}%</span>`;
}
function badge(status) { return `<span class="badge ${status.toLowerCase()}"><span class="small-dot"></span>${e(status)}</span>`; }
function sparkline(index, key) {
  const values = state.data.series.map(point => point[key]);
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const points = values.map((value, i) => `${(i * 76 / Math.max(values.length - 1, 1)).toFixed(1)},${(32 - (value - min) / span * 27).toFixed(1)}`).join(' ');
  return `<svg class="sparkline" viewBox="0 0 76 38" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="spark-${index}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#70ad90" stop-opacity=".2"/><stop offset="100%" stop-color="#70ad90" stop-opacity="0"/></linearGradient></defs><polygon points="${points} 76,38 0,38" fill="url(#spark-${index})"/><polyline points="${points}" stroke="#8fbaa1" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function statsHTML() {
  const { stats, change } = state.data;
  const cards = [ ['Total revenue', 'revenue', 'wallet', money(stats.revenue)], ['Total orders', 'orders', 'bag', number(stats.orders)], ['Avg. order value', 'average', 'cart', money(stats.average, 2)], ['Unique customers', 'customers', 'users', number(stats.customers)] ];
  return `<section class="stats-grid" aria-label="Key performance indicators">${cards.map(([label, key, symbol, value], i) => `<article class="stat-card"><div class="stat-top"><span class="stat-icon">${icon(symbol)}</span>${label}<span class="stat-menu" title="Compared with the previous ${state.range === 1 ? '24 hours' : `${state.range} days`}">${icon('info')}</span></div><div class="stat-body"><strong class="stat-value">${value}</strong>${sparkline(i, key)}</div><div class="stat-bottom">${changeBadge(change[key])}<span>vs. previous ${state.range === 1 ? '24 hours' : `${state.range} days`}</span></div></article>`).join('')}</section>`;
}
function chartHTML() {
  const { series, stats, change } = state.data;
  let cumulative = 0, previousCumulative = 0;
  const points = series.map(point => ({ ...point, revenue: state.chart === 'cumulative' ? (cumulative += point.revenue) : point.revenue, previous: state.chart === 'cumulative' ? (previousCumulative += point.previous) : point.previous }));
  const W = window.innerWidth <= 600 ? 360 : window.innerWidth <= 1000 ? 450 : 600;
  const H = 207, left = 44, right = 15, top = 18, bottom = 27;
  const max = Math.max(...points.flatMap(p => [p.revenue, p.previous]), 1);
  const step = Math.pow(10, Math.floor(Math.log10(max))) / 2;
  const ceiling = Math.ceil(max / step) * step;
  const x = i => left + i * (W - left - right) / Math.max(points.length - 1, 1);
  const y = value => top + (1 - value / ceiling) * (H - top - bottom);
  const pathFor = key => points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ');
  const area = `${pathFor('revenue')} L${x(points.length - 1)},${H - bottom} L${left},${H - bottom} Z`;
  const grid = Array.from({ length: 5 }, (_, i) => {
    const value = ceiling * i / 4, position = y(value);
    const label = value >= 1000 ? `$${+(value / 1000).toFixed(1)}k` : `$${Math.round(value)}`;
    return `<line x1="${left}" x2="${W - right}" y1="${position}" y2="${position}" class="chart-grid"/><text x="${left - 12}" y="${position + 3}" text-anchor="end" class="chart-label">${label}</text>`;
  }).join('');
  const labels = points.map((point, i) => {
    if (points.length > 12 && i % 5 !== 0 && i !== points.length - 1) return '';
    if (points.length === 12 && i % 2 !== 0 && i !== 11) return '';
    return `<text x="${x(i)}" y="${H - 6}" text-anchor="middle" class="chart-label">${e(state.range === 1 ? time(point.timestamp) : date(point.timestamp))}</text>`;
  }).join('');
  return `<article class="card chart-card"><div class="card-header"><div><h2 class="card-title">Revenue overview</h2><p class="card-subtitle">A clearer view of how your business is growing</p></div><div class="chart-tabs" role="group" aria-label="Chart display"><button class="chart-tab ${state.chart === 'daily' ? 'active' : ''}" data-chart="daily" aria-pressed="${state.chart === 'daily'}">${state.range === 1 ? 'Hourly' : 'Daily'}</button><button class="chart-tab ${state.chart === 'cumulative' ? 'active' : ''}" data-chart="cumulative" aria-pressed="${state.chart === 'cumulative'}">Cumulative</button></div></div><div class="chart-summary"><strong>${money(stats.revenue)}</strong>${changeBadge(change.revenue, true)}<div class="chart-legend"><span class="legend-item"><i class="legend-line"></i>Current period</span><span class="legend-item"><i class="legend-line previous"></i>Previous period</span></div></div><div class="revenue-chart"><svg class="revenue-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Revenue over ${state.range === 1 ? '24 hours' : `${state.range} days`}. Current period ${money(stats.revenue)} compared to the previous period."><defs><linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#63a98a" stop-opacity=".19"/><stop offset="1" stop-color="#63a98a" stop-opacity="0"/></linearGradient></defs>${grid}<path d="${pathFor('previous')}" fill="none" stroke="#c3d4c9" stroke-width="1.5" stroke-dasharray="4 5" stroke-linejoin="round"/><path d="${area}" fill="url(#revenue-fill)"/><path d="${pathFor('revenue')}" fill="none" stroke="#258469" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>${points.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.revenue)}" r="3" fill="var(--surface)" stroke="#258469" stroke-width="1.5"/>`).join('')}${labels}${points.map((p, i) => `<rect class="chart-hit" x="${x(i) - 15}" y="${top}" width="30" height="${H - top - bottom}" data-tooltip="${e(`${state.range === 1 ? time(p.timestamp) : date(p.timestamp)}|${money(p.revenue)}|${money(p.previous)}`)}"><title>${e(date(p.timestamp))}: ${money(p.revenue)} · previous ${money(p.previous)}</title></rect>`).join('')}</svg><div class="chart-tooltip" hidden></div></div></article>`;
}
function categoryHTML() {
  const { categories, stats } = state.data;
  const total = stats.revenue || 1, radius = 65, circumference = 2 * Math.PI * radius;
  let offset = 0;
  const circles = categories.map((category, i) => {
    const fraction = category.revenue / total;
    const result = `<circle cx="90" cy="90" r="${radius}" fill="none" stroke="${COLORS[i % COLORS.length]}" stroke-width="20" stroke-dasharray="${Math.max(0, fraction * circumference - 3)} ${circumference}" stroke-dashoffset="${-offset}" stroke-linecap="butt"><title>${e(category.name)}: ${money(category.revenue)}</title></circle>`;
    offset += fraction * circumference;
    return result;
  }).join('');
  return `<article class="card category-card"><div class="card-header"><div><h2 class="card-title">Sales by category</h2><p class="card-subtitle">Where your revenue comes from</p></div><button class="icon-button" data-action="category-info" aria-label="About category sales">${icon('info')}</button></div><div class="donut-wrap"><svg class="donut-svg" viewBox="0 0 180 180" role="img" aria-label="Revenue by category: ${e(categories.map(c => `${c.name} ${Math.round(c.revenue / total * 100)}%`).join(', '))}"><circle cx="90" cy="90" r="${radius}" fill="none" stroke="var(--bg)" stroke-width="20"/>${circles}</svg><div class="donut-center"><span>Total sales</span><strong>${stats.revenue >= 1000 ? `$${(stats.revenue / 1000).toFixed(1)}k` : money(stats.revenue)}</strong><small>across ${categories.length} ${categories.length === 1 ? 'category' : 'categories'}</small></div></div><div class="category-legend">${categories.map((c, i) => `<div class="category-row"><span class="small-dot" style="color:${COLORS[i % COLORS.length]}"></span><span>${e(c.name)}</span><strong>${money(c.revenue)}</strong><small>${(c.revenue / total * 100).toFixed(0)}%</small></div>`).join('')}</div></article>`;
}
function productHTML(limit = 5) {
  const products = state.data.products.slice(0, limit);
  return `<article class="card" id="products-analysis"><div class="card-header products-header"><div><h2 class="card-title">Top products</h2><p class="card-subtitle">The things your customers love</p></div><span class="badge neutral">By revenue</span></div><div class="product-list">${products.map(p => `<div class="product-row"><span class="product-thumbnail ${e(p.color)}">${icon(p.icon)}</span><span class="product-info"><strong>${e(p.name)}</strong><small>${e(p.category)}</small></span><span class="product-sales"><strong>${money(p.revenue)}</strong><small>${number(p.units)} units sold</small></span></div>`).join('')}</div><div class="card-footer"><span>${limit > 5 ? 'Completed orders only' : `${state.range === 1 ? 'Last 24 hours' : `Last ${state.range} days`} performance`}</span>${limit <= 5 ? `<a class="text-link" href="#analytics">View all products ${icon('arrow-right')}</a>` : '<span>Revenue in USD</span>'}</div></article>`;
}
function transactionRows(rows, full = false) {
  if (!rows.length) return `<tr><td colspan="${full ? 7 : 5}"><div class="empty-state">${icon('search')}<strong>No transactions found</strong><p>Try another search, a different filter, or a wider date range.</p><button class="button" data-action="reset-filters">Clear filters</button></div></td></tr>`;
  return rows.map(t => `<tr><td><button class="order-link" data-order="${e(t.transaction_id)}" aria-label="View order ${e(t.order_id)}">#${e(t.order_id.replace('ORD-', ''))}</button></td><td><div class="customer-cell"><span class="customer-avatar ${e(t.color)}">${e(initials(t.customer_name))}</span><span><span class="customer-name">${e(t.customer_name)}</span><span class="customer-email">${e(t.customer_email)}</span></span></div></td>${full ? `<td>${e(t.product_name)}<span class="customer-email">${e(t.category)}</span></td>` : ''}<td class="table-amount">${money(t.total_amount, 2)}</td><td>${badge(t.status)}</td>${full ? `<td>${e(t.country)}</td>` : ''}<td class="text-right"><span>${time(t.timestamp)}</span><span class="customer-email">${date(t.timestamp)}</span></td></tr>`).join('');
}
function tableHead(full) { return `<thead><tr><th scope="col">Order ID</th><th scope="col">Customer</th>${full ? '<th scope="col">Product</th>' : ''}<th scope="col">Amount</th><th scope="col">Status</th>${full ? '<th scope="col">Country</th>' : ''}<th scope="col" class="text-right">Time</th></tr></thead>`; }
function recentHTML() {
  const t = state.transactions;
  return `<article class="card"><div class="card-header table-header"><div><div class="transaction-heading"><h2 class="card-title">Recent transactions</h2><span class="count-badge">${number(t.total)}</span></div><p class="card-subtitle">The latest from your store, as it happens</p></div><a href="#transactions" class="button">View all ${icon('arrow-right')}</a></div><div class="table-wrapper"><table aria-label="Recent transactions">${tableHead(false)}<tbody>${transactionRows(t.rows.slice(0, 5))}</tbody></table></div><div class="card-footer table-footer"><span><span class="small-dot" style="color:var(--green);width:4px;height:4px;margin-right:5px"></span>${state.paused ? 'Updates paused' : modeText('New transactions arrive every 6.5 seconds', 'Updates arrive when the warehouse changes')}</span><span class="badge neutral">${modeText('Simulated data', 'PostgreSQL')}</span></div></article>`;
}
function pipelineStripHTML() {
  return `<section class="pipeline-strip" aria-label="${modeText('Local demo stream status', 'Warehouse update status')}"><div class="pipeline-strip-title"><span class="pipeline-strip-icon">${icon('workflow')}</span><div><strong>${modeText('Your sandbox', 'Your warehouse')} is ${state.paused ? 'paused' : state.connected ? 'connected' : 'reconnecting'}</strong><small>${modeText('Simulated events. Real insights. Explore the flow behind your data.', 'Validated events, durable records, and live analytics. Explore your data flow.')}</small></div></div><div class="mini-flow"><span><i class="small-dot"></i>Generate</span>${icon('arrow-right')}<span><i class="small-dot"></i>Process</span>${icon('arrow-right')}<span><i class="small-dot"></i>Visualize</span></div><a href="#pipeline" class="text-link">View pipeline ${icon('arrow-right')}</a></section>`;
}
function overviewHTML() { return `${statsHTML()}<div class="section-grid">${chartHTML()}${categoryHTML()}</div><div class="section-grid">${recentHTML()}${productHTML()}</div>${pipelineStripHTML()}`; }
function analyticsHTML() {
  const { countries, payments, stats } = state.data;
  const countryMax = Math.max(...countries.map(c => c.revenue), 1);
  return `${statsHTML()}<div class="section-grid">${chartHTML()}${categoryHTML()}</div><div class="analytics-grid"><article class="card"><div class="card-header"><div><h2 class="card-title">A world of customers</h2><p class="card-subtitle">Revenue by country · completed orders</p></div>${icon('globe')}</div><div class="horizontal-bars">${countries.map(c => `<div class="bar-row"><div class="bar-meta"><span>${e(c.name)}</span><strong>${money(c.revenue)}</strong></div><div class="bar-track"><div class="bar-fill" style="width:${c.revenue / countryMax * 100}%"></div></div></div>`).join('')}</div></article><article class="card"><div class="card-header"><div><h2 class="card-title">How customers pay</h2><p class="card-subtitle">Payment methods across all orders</p></div>${icon('card')}</div><div class="payment-list">${payments.sort((a, b) => b.orders - a.orders).map(p => `<div class="payment-row"><span class="payment-icon">${icon({ card: 'card', bank_transfer: 'bank', mobile_money: 'phone', cash: 'wallet' }[p.name])}</span><span>${PAYMENT_NAMES[p.name]}</span><strong>${number(p.orders)}</strong><small>${(p.orders / (stats.orders || 1) * 100).toFixed(1)}%</small></div>`).join('')}</div><div class="card-footer"><span>${number(stats.orders)} orders analyzed</span><span>${modeText('Simulated transactions', 'Warehouse transactions')}</span></div></article></div>${productHTML(10)}<div style="height:23px"></div>${pipelineStripHTML()}`;
}
function paginationHTML(t) {
  return `<span>${t.total ? `${number((t.page - 1) * t.pageSize + 1)}–${number(Math.min(t.page * t.pageSize, t.total))} of ${number(t.total)} transactions` : '0 transactions'}</span><div class="pagination"><button data-pagination="previous" aria-label="Previous page" ${t.page <= 1 ? 'disabled' : ''}>${icon('chevron-left')}</button><span>${t.page} / ${t.pages}</span><button data-pagination="next" aria-label="Next page" ${t.page >= t.pages ? 'disabled' : ''}>${icon('chevron-right')}</button></div>`;
}
function transactionsHTML() {
  const t = state.transactions;
  const categories = state.data.categories.map(c => c.name).sort();
  return `<article class="card transactions-full"><div class="status-tabs" role="group" aria-label="Filter by transaction status">${['', 'Completed', 'Pending', 'Failed'].map(s => `<button class="status-tab ${state.status === s ? 'active' : ''}" data-status="${s}" aria-pressed="${state.status === s}">${s || 'All transactions'}<span>${number(s ? state.data.statusCounts[s] : state.data.stats.orders)}</span></button>`).join('')}</div><div class="transactions-toolbar"><div class="search-box">${icon('search')}<input id="transaction-search" type="search" aria-label="Search transactions" placeholder="Search orders, customers, products…" value="${e(state.search)}"></div><div class="filter-group"><select class="filter-select" id="category-filter" aria-label="Filter by category"><option value="">All categories</option>${categories.map(c => `<option ${state.category === c ? 'selected' : ''}>${e(c)}</option>`).join('')}</select><select class="filter-select" id="sort-filter" aria-label="Sort transactions"><option value="newest" ${state.sort === 'newest' ? 'selected' : ''}>Newest first</option><option value="oldest" ${state.sort === 'oldest' ? 'selected' : ''}>Oldest first</option><option value="amount" ${state.sort === 'amount' ? 'selected' : ''}>Highest amount</option></select><button class="button" data-action="toggle-stream">${icon(state.paused ? 'play' : 'pause')}${state.paused ? 'Resume' : 'Pause'}</button></div></div><div class="table-wrapper"><table aria-label="All transactions">${tableHead(true)}<tbody id="transactions-body">${transactionRows(t.rows, true)}</tbody></table></div><div class="card-footer table-footer" id="transactions-pagination">${paginationHTML(t)}</div></article><div class="notice" style="margin-top:20px">${icon('info')}<span>${modeText('This is a live, simulated dataset. Transaction details, customer names, and payment activity are fictional.', 'Transactions are stored in PostgreSQL. Access and exports require an authenticated workspace session.')} Exports include the current date range and active filters.</span></div>`;
}
function pipelineHTML() {
  if (!isDemo()) return productionPipelineHTML();
  const nodes = [['code', 'Generator', 'Python / Faker'], ['arrows', 'Kafka', 'Event streaming'], ['sparkles', 'Spark', 'Stream processing'], ['database', 'PostgreSQL', 'Data warehouse'], ['layers', 'dbt', 'Transformation'], ['chart', 'Dashboard', 'Business insights']];
  return `<div class="notice">${icon('info')}<span><strong>You’re exploring the demo pipeline.</strong> The local Node.js server generates and aggregates sample transactions. The services below show the project’s intended architecture; external services are not connected.</span></div><article class="card"><div class="card-header"><div><h2 class="card-title">From event to insight</h2><p class="card-subtitle">One connected view of your data’s journey</p></div><button class="button" data-action="toggle-stream">${icon(state.paused ? 'play' : 'pause')}${state.paused ? 'Resume updates' : 'Pause updates'}</button></div><div class="pipeline-view"><div class="flow-track">${nodes.map(([symbol, name, subtitle]) => `<div class="flow-node">${icon(symbol)}<strong>${name}</strong><small>${subtitle}</small><span class="badge ${name === 'Dashboard' ? 'demo' : 'neutral'}">${name === 'Dashboard' ? 'Local demo' : 'Architecture'}</span></div>`).join('')}</div><div class="pipeline-metrics"><div><span>LOCAL DATASET</span><strong>${number(state.data.totalRecords)}</strong><small>In-memory sample transactions</small></div><div><span>EVENT INTERVAL</span><strong>6.5 <span>sec</span></strong><small>One generated transaction per interval</small></div><div><span>DATA SOURCE</span><strong>Demo</strong><small>External services not connected</small></div></div></div></article><div class="analytics-grid" style="margin-top:23px"><article class="card"><div class="card-header"><div><h2 class="card-title">External services</h2><p class="card-subtitle">Start the infrastructure with Docker Compose</p></div><button class="text-link" data-action="setup">Setup guide ${icon('arrow-right')}</button></div><div class="service-list">${[['arrows', 'Apache Kafka', 'Message broker · localhost:9092'], ['sparkles', 'Apache Spark', 'Stream processor · Python script'], ['database', 'PostgreSQL', 'Data warehouse · localhost:5432'], ['layers', 'dbt', 'SQL transformation models'], ['workflow', 'Apache Airflow', 'Pipeline orchestration DAG']].map(([symbol, name, description]) => `<div class="service-row">${icon(symbol)}<div><strong>${name}</strong><p>${description}</p></div><span class="badge neutral">Not connected</span></div>`).join('')}</div></article><article class="card"><div class="card-header"><div><h2 class="card-title">Local event activity</h2><p class="card-subtitle">Events received in this browser session</p></div><span class="badge ${state.paused ? 'pending' : 'demo'}">${state.paused ? 'Paused' : 'Streaming'}</span></div><div class="log-list" id="event-logs">${logsHTML()}</div><div class="card-footer"><span>Latest 8 events</span><span>Simulated stream</span></div></article></div>`;
}
function logsHTML() {
  if (!state.logs.length) return `<div class="empty-state">${icon('activity')}<strong>Listening for the next event</strong><p>${state.paused ? 'Resume live updates to receive events.' : modeText('A sample transaction arrives every 6.5 seconds.', 'New warehouse changes will appear here.')}</p></div>`;
  return state.logs.slice(0, 8).map(t => `<div class="log-row"><time>${time(t.timestamp)}</time><span class="small-dot"></span><span>${t.kind === 'refresh' ? 'Warehouse changed · refreshing analytics' : `${e(t.order_id)} · ${e(t.category)} · ${money(t.total_amount, 2)}`}</span></div>`).join('');
}
function warehouseHTML() {
  if (!isDemo()) return productionWarehouseHTML();
  const fields = [['transaction_id', 'VARCHAR', 'PRIMARY KEY', 'Unique transaction identifier'], ['customer_id', 'VARCHAR', 'NULLABLE', 'Unique customer identifier'], ['product_name', 'VARCHAR', 'NULLABLE', 'Name of the purchased product'], ['category', 'VARCHAR', 'NULLABLE', 'Product category'], ['quantity', 'INTEGER', 'NULLABLE', 'Number of units purchased'], ['unit_price', 'NUMERIC(10,2)', 'NULLABLE', 'Price per unit in USD'], ['total_amount', 'NUMERIC(10,2)', 'NULLABLE', 'Quantity × unit price'], ['payment_method', 'VARCHAR', 'NULLABLE', 'Card, transfer, cash, or mobile money'], ['country', 'VARCHAR', 'NULLABLE', 'Customer country'], ['created_at', 'TIMESTAMP', 'NULLABLE', 'Timestamp of the transaction']];
  return `<section class="warehouse-banner"><div><h2>A little structure goes a long way.</h2><p>Your PostgreSQL schema gives every transaction a home.<br>The dashboard currently uses ${number(state.data.totalRecords)} in-memory demo records.</p></div>${icon('database')}</section><article class="card schema-card"><div class="card-header"><div><h2 class="card-title">raw_transactions</h2><p class="card-subtitle">Schema from warehouse/create_tables.sql · public schema</p></div><span class="badge neutral">10 columns</span></div><div class="table-wrapper"><table aria-label="PostgreSQL raw transactions schema"><thead><tr><th scope="col">Column name</th><th scope="col">Data type</th><th scope="col">Constraint</th><th scope="col">Description</th></tr></thead><tbody>${fields.map(([name, type, constraint, description]) => `<tr><td><code>${name}</code></td><td>${type}</td><td><span class="badge neutral">${constraint}</span></td><td>${description}</td></tr>`).join('')}</tbody></table></div><div class="card-footer"><span>PostgreSQL connection is not configured for this UI</span><button class="text-link" data-action="schema">View SQL ${icon('code')}</button></div></article><div class="notice">${icon('info')}<span>The sample API also includes customer names, order status, and product presentation fields for the dashboard. These are demo enrichments. No records are written to PostgreSQL, and demo data resets when the local server restarts.</span></div>`;
}
function settingsHTML() {
  return `<form id="settings-form" class="card settings-card"><div class="settings-section"><h2>Your workspace</h2><p>A few personal touches to make this space yours. Preferences are saved in this browser.</p><div class="form-grid"><div class="field"><label for="display-name">Display name</label><input id="display-name" name="displayName" value="${e(state.name)}" required maxlength="60" autocomplete="name"></div><div class="field"><label for="workspace-name">Workspace name</label><input id="workspace-name" name="workspaceName" value="${e(state.workspace)}" required maxlength="60"></div></div></div><div class="settings-section"><h2>Dashboard preferences</h2><p>Pick your starting point and how you like to see your data.</p><div class="form-grid"><div class="field"><label for="default-range">Default reporting period</label><select id="default-range" name="range"><option value="1" ${state.range === 1 ? 'selected' : ''}>Last 24 hours</option><option value="7" ${state.range === 7 ? 'selected' : ''}>Last 7 days</option><option value="30" ${state.range === 30 ? 'selected' : ''}>Last 30 days</option></select></div><div class="field"><label for="currency">Reporting currency</label><input id="currency" value="US dollar (USD)" readonly><small>All sample prices are denominated in USD.</small></div></div><div class="setting-row"><div><strong>Dark appearance</strong><small>A softer view when the day winds down.</small></div><label class="switch"><input type="checkbox" id="dark-mode" aria-label="Use dark appearance" ${document.documentElement.dataset.theme === 'dark' ? 'checked' : ''}><span></span></label></div><div class="setting-row"><div><strong>Live updates</strong><small>${modeText('Receive a simulated transaction every 6.5 seconds.', 'Refresh when warehouse transactions change.')}</small></div><label class="switch"><input type="checkbox" id="live-updates" aria-label="Enable live updates" ${state.paused ? '' : 'checked'}><span></span></label></div></div><div class="settings-section"><h2>About this workspace</h2><p style="margin-bottom:0"><strong>Real-Time E-commerce Data Platform</strong><br>${modeText('Local demo','PostgreSQL workspace')} · Version 2.0.0<br>${modeText('Sample transactions are generated in memory.', 'Workspace access is restricted to the configured administrator.')}</p></div><div class="settings-actions"><button class="button primary" type="submit">${icon('check')}Save preferences</button></div></form>`;
}
function render() {
  if (!state.data || !state.transactions) return;
  const content = $('#page-content');
  content.innerHTML = ({ overview: overviewHTML, analytics: analyticsHTML, transactions: transactionsHTML, pipeline: pipelineHTML, warehouse: warehouseHTML, settings: settingsHTML })[state.page]();
  content.setAttribute('aria-busy', 'false');
  updateLiveStatus();
}
function params(includeFilters = false) {
  const p = new URLSearchParams({ range: state.range });
  if (includeFilters) { p.set('search', state.search); p.set('status', state.status); p.set('category', state.category); p.set('sort', state.sort); p.set('page', state.tablePage); }
  return p;
}
async function getJSON(url) {
  const response = await fetch(url);
  if (response.status === 401) { state.stream?.close(); location.replace('/login'); throw new Error('Your session expired. Please sign in.'); }
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || 'The data service could not complete the request.'); }
  return response.json();
}
function showError(message) { const el = $('#error-banner'); el.textContent = `${message} Check the service status, then refresh the page.`; el.hidden = false; }
async function refresh({ full = true } = {}) {
  const request = ++state.refreshRequest;
  const transactionsRequest = ++state.request;
  try {
    const [data, transactions, health] = await Promise.all([getJSON(`/api/dashboard?range=${state.range}`), getJSON(`/api/transactions?${params(state.page === 'transactions')}`), getJSON('/api/health')]);
    if (request !== state.refreshRequest) return;
    state.data = data; state.mode = data.mode; state.health = health;
    if (transactionsRequest === state.request) state.transactions = transactions;
    $('#error-banner').hidden = true;
    if (!full && state.page === 'transactions') updateTransactionTable();
    else if (!full && state.page === 'settings') updateLiveStatus();
    else render();
  } catch (error) { showError(error.message); $('#page-content').setAttribute('aria-busy', 'false'); }
}
async function refreshTransactions() {
  const request = ++state.request;
  try {
    const t = await getJSON(`/api/transactions?${params(true)}`);
    if (request !== state.request || state.page !== 'transactions') return;
    state.transactions = t;
    state.tablePage = t.page;
    updateTransactionTable();
    $('#error-banner').hidden = true;
  } catch (error) { showError(error.message); }
}
function updateTransactionTable() {
  if (!$('#transactions-body')) return;
  $('#transactions-body').innerHTML = transactionRows(state.transactions.rows, true);
  $('#transactions-pagination').innerHTML = paginationHTML(state.transactions);
  $$('.status-tab').forEach(button => {
    const active = button.dataset.status === state.status;
    button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
    $('span', button).textContent = number(button.dataset.status ? state.data.statusCounts[button.dataset.status] : state.data.stats.orders);
  });
  updateLiveStatus();
}
function updateLiveStatus() {
  const pill = $('#live-pill');
  const polling = !isDemo() && state.health?.streamConnected === false;
  pill.classList.toggle('paused', state.paused || !state.connected);
  pill.innerHTML = `<span class="small-dot"></span>${state.paused ? 'Updates paused' : state.connected ? polling ? 'Polling updates' : 'Live updates' : 'Reconnecting'}`;
  const summary = $('.pipeline-strip strong'); if (summary) summary.textContent = modeText('Your sandbox', 'Your warehouse') + (state.paused ? ' is paused' : !state.connected ? ' is reconnecting' : polling ? ' is refreshing periodically' : ' is connected');
  $('#footer-status').textContent = `${state.paused ? 'Live updates paused' : state.connected ? modeText('Local stream connected', polling ? 'Warehouse polling active' : 'Warehouse stream connected') : 'Connecting to update stream'} · ${modeText('Simulated data', 'PostgreSQL')}${state.data ? ` · Updated ${time(state.data.generatedAt)}` : ''}`;
}
function connectStream() {
  if (state.stream) state.stream.close();
  state.connected = false;
  if (state.paused) { updateLiveStatus(); return; }
  const stream = state.stream = new EventSource('/api/events');
  stream.addEventListener('connected', () => { state.connected = true; updateLiveStatus(); if (state.data) refresh({ full: false }); });
  stream.addEventListener('unauthorized', () => { stream.close(); location.replace('/login'); });
  stream.addEventListener('unavailable', () => { state.connected = false; updateLiveStatus(); });
  stream.addEventListener('refresh', () => { state.logs.unshift({ kind: 'refresh', timestamp: new Date().toISOString() }); state.logs.length = Math.min(state.logs.length, 8); refresh({ full: false }); });
  stream.addEventListener('transaction', event => {
    const transaction = JSON.parse(event.data);
    state.logs.unshift(transaction); state.logs.length = Math.min(state.logs.length, 8);
    state.notifications.unshift({ title: `${transaction.order_id} received`, text: `${transaction.product_name} · ${money(transaction.total_amount, 2)} · ${time(transaction.timestamp)}` });
    state.notifications.length = Math.min(state.notifications.length, 5);
    if (!$('#notification-panel').hidden) renderNotifications();
    refresh({ full: false });
  });
  stream.onerror = () => { state.connected = false; updateLiveStatus(); };
  updateLiveStatus();
}
function toggleStream() {
  state.paused = !state.paused; savePreference('paused', state.paused); connectStream();
  if (state.page === 'pipeline' || state.page === 'overview') render();
  else if (state.page === 'transactions') {
    const button = $('[data-action="toggle-stream"]');
    if (button) button.innerHTML = `${icon(state.paused ? 'play' : 'pause')}${state.paused ? 'Resume' : 'Pause'}`;
  }
  toast(state.paused ? 'Live updates paused. Your current view is preserved.' : 'Live updates resumed.');
}
async function navigate() {
  const hash = location.hash.slice(1);
  state.page = Object.hasOwn(PAGES, hash) ? hash : 'overview';
  const [eyebrow, title, description] = PAGES[state.page];
  $('#eyebrow').textContent = eyebrow; $('#page-title').textContent = title; $('#page-description').textContent = description;
  document.title = `${title} · Real-Time E-commerce Data Platform`;
  $$('.nav-item[data-page]').forEach(item => { const active = item.dataset.page === state.page; item.classList.toggle('active', active); if (active) item.setAttribute('aria-current', 'page'); else item.removeAttribute('aria-current'); });
  $('.intro-actions').hidden = state.page === 'settings';
  $('#date-range').value = state.range;
  closeMobileMenu(); window.scrollTo({ top: 0, behavior: 'instant' });
  if (state.data && state.transactions) render();
  await refresh();
}
function toast(message) {
  clearTimeout(state.toastTimeout); $('#toast').textContent = message; $('#toast').hidden = false;
  state.toastTimeout = setTimeout(() => { $('#toast').hidden = true; }, 4200);
}
function setTheme(dark) {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'; savePreference('theme', dark ? 'dark' : 'light');
  $('#theme-button').innerHTML = icon(dark ? 'moon' : 'sun');
  $('#theme-button').setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  if ($('#dark-mode')) $('#dark-mode').checked = dark;
}
function updateProfile() {
  $('.profile strong').textContent = state.name;
  $$('.profile-avatar,.top-avatar').forEach(avatar => { avatar.textContent = initials(state.name); });
  $('.workspace-switch strong').textContent = state.workspace;
}
function updateSidebarAccessibility() {
  const collapsed = window.matchMedia('(max-width:780px)').matches && !$('#sidebar').classList.contains('open');
  $('#sidebar').inert = collapsed;
  $('#sidebar').setAttribute('aria-hidden', String(collapsed));
}
function closeMobileMenu() {
  const wasOpen = $('#sidebar').classList.contains('open');
  $('#sidebar').classList.remove('open'); $('#mobile-scrim').classList.remove('open'); $('#menu-button').setAttribute('aria-expanded', 'false');
  updateSidebarAccessibility();
  if (wasOpen && window.matchMedia('(max-width:780px)').matches) $('#menu-button').focus();
}
function openDialog(title, subtitle, body, footer = '') {
  $('#dialog-content').innerHTML = `<div class="dialog-header"><div><h2 id="dialog-title">${e(title)}</h2><p>${e(subtitle)}</p></div><button class="icon-button" data-action="close-dialog" aria-label="Close dialog">${icon('close')}</button></div><div class="dialog-body">${body}</div><div class="dialog-footer">${footer}<button class="button" data-action="close-dialog">Close</button></div>`;
  if (!$('#detail-dialog').open) $('#detail-dialog').showModal();
}
function orderDialog(id) {
  const t = state.transactions.rows.find(row => row.transaction_id === id);
  if (!t) return;
  const detail = (label, value, wide = false) => `<div class="${wide ? 'detail-wide' : ''}"><span class="detail-label">${label}</span><span class="detail-value">${value}</span></div>`;
  openDialog(`#${t.order_id.replace('ORD-', '')}`, modeText('Transaction details · Simulated data', 'Transaction details · PostgreSQL'), `<div class="detail-grid">${detail('Customer', e(t.customer_name))}${detail('Status', badge(t.status))}${detail('Email', e(t.customer_email), true)}${detail('Product', e(t.product_name))}${detail('Category', e(t.category))}${detail('Quantity', number(t.quantity))}${detail('Unit price', money(t.unit_price, 2))}${detail('Total amount', money(t.total_amount, 2))}${detail('Payment method', PAYMENT_NAMES[t.payment_method])}${detail('Country', e(t.country))}${detail('Date & time', e(new Date(t.timestamp).toLocaleString()))}${detail('Transaction ID', `<code style="font-size:10px">${e(t.transaction_id)}</code>`, true)}</div>`);
}
function helpDialog() {
  if (!isDemo()) return openDialog('Your production workspace', 'Real-Time E-commerce Data Platform', '<section class="help-section"><h3>Reporting</h3><p>Revenue includes completed orders. Average order value divides completed revenue by completed orders. Customer counts use distinct customer IDs. Comparisons use the immediately preceding period of equal length. All amounts are USD.</p></section><section class="help-section"><h3>Data and operations</h3><p>Transactions and sessions are stored in PostgreSQL. Ingestion requires a separate API key or the optional Kafka worker. Exports honor active filters and the configured row limit. Deployment, backups, restores, retention, and incident handling are covered in PRODUCTION.md.</p></section><section class="help-section"><h3>Preferences and access</h3><p>Display preferences are saved in this browser. Use Sign out to revoke the current server-side session. Access is limited to the administrator configured by your operator.</p></section>');
  openDialog('A little help, right here.', 'Your guide to the Real-Time E-commerce Data Platform', `<section class="help-section"><h3>Start the local dashboard</h3><p>In the project directory, run the command below. Use Node.js 24 LTS. Run npm ci once after extracting the source.</p><code class="code-block">npm start</code><p>Visit http://localhost:3000. For automatic server restarts during development, use <code>npm run dev</code>.</p></section><section class="help-section"><h3>Explore your data</h3><p>Change the reporting period to compare the last 24 hours, 7 days, or 30 days. Revenue includes completed orders. Average order value is completed revenue divided by completed orders. Customer counts are distinct customer IDs. Percentage changes compare the previous period of equal length.</p></section><section class="help-section"><h3>Find the details</h3><p>Search and filter on the Transactions page. Select an order ID to see its details. Export report downloads all matching transactions as a CSV file. Pause updates to keep the current view still.</p></section><section class="help-section"><h3>Connect the original pipeline</h3><p>The included Python, Kafka, Spark, PostgreSQL, dbt, and Airflow files describe the original pipeline. Follow HOW_TO_RUN.md to set up the available Docker services. This dashboard currently reads only the local simulator; it does not query those services.</p><code class="code-block">docker compose up -d\npython data_generator/generator.py</code></section><section class="help-section"><h3>Demo data and preferences</h3><p>All customers and transactions are fictional. Records live in server memory and reset on restart. Your name, workspace, theme, and reporting period are saved in this browser only.</p></section>`);
}
function renderNotifications() {
  const messages = state.notifications.length ? state.notifications : [{ title: 'Your workspace is ready', text: modeText('The local simulator is generating sample commerce transactions.', 'Your workspace is connected to PostgreSQL.') }, { title: 'A clear view of your data', text: 'Explore Analytics for product, country, and payment insights.' }];
  $('#notification-list').innerHTML = messages.map(m => `<div class="notification">${icon('activity')}<div><strong>${e(m.title)}</strong><p>${e(m.text)}</p></div></div>`).join('');
}
async function exportCSV() {
  const button = $('#export-button');
  button.disabled = true; button.innerHTML = `${icon('download')}Preparing…`;
  try {
    const response = await fetch(`/api/export?${params(state.page === 'transactions')}`);
    if (response.status === 401) { location.replace('/login'); return; }
    if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || 'Export failed. Please try again.'); }
    const blob = await response.blob();
    const href = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = href; link.download = `commerce-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(href), 10000);
    toast('Your CSV report is ready. Check your downloads.');
  } catch (error) { toast(error.message); }
  finally { button.disabled = false; button.innerHTML = `${icon('download')}Export report`; }
}
document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (button?.dataset.order) orderDialog(button.dataset.order);
  if (button?.dataset.chart) { state.chart = button.dataset.chart; const card = $('.chart-card'); if (card) card.outerHTML = chartHTML(); }
  if (button?.hasAttribute('data-status')) { state.status = button.dataset.status; state.tablePage = 1; refreshTransactions(); }
  if (button?.dataset.pagination) { state.tablePage = Math.max(1, state.tablePage + (button.dataset.pagination === 'next' ? 1 : -1)); refreshTransactions(); }
  const action = button?.dataset.action;
  if (action === 'close-dialog') $('#detail-dialog').close();
  if (action === 'toggle-stream') toggleStream();
  if (action === 'setup') helpDialog();
  if (action === 'reset-filters') { state.search = ''; state.category = ''; state.status = ''; state.sort = 'newest'; state.tablePage = 1; render(); refreshTransactions(); }
  if (action === 'category-info') openDialog('Sales by category', 'A share of the bigger picture', '<p>Each segment represents a category’s share of revenue from <strong>completed orders</strong> during the selected period. Pending and failed orders do not contribute to revenue. All amounts are in US dollars.</p>');
  if (action === 'schema') openDialog('raw_transactions', 'PostgreSQL schema · warehouse/create_tables.sql', `<pre class="code-block">CREATE TABLE raw_transactions (\n  transaction_id VARCHAR PRIMARY KEY,\n  customer_id VARCHAR,\n  product_name VARCHAR,\n  category VARCHAR,\n  quantity INTEGER,\n  unit_price NUMERIC(10,2),\n  total_amount NUMERIC(10,2),\n  payment_method VARCHAR,\n  country VARCHAR,\n  created_at TIMESTAMP\n);</pre>`);
  if (!event.target.closest('#notification-panel') && !event.target.closest('#notification-button')) { $('#notification-panel').hidden = true; $('#notification-button').setAttribute('aria-expanded', 'false'); }
});
let searchTimeout;
document.addEventListener('input', event => {
  if (event.target.id === 'transaction-search') { state.search = event.target.value; state.tablePage = 1; clearTimeout(searchTimeout); searchTimeout = setTimeout(refreshTransactions, 220); }
});
document.addEventListener('change', event => {
  if (event.target.id === 'category-filter') { state.category = event.target.value; state.tablePage = 1; refreshTransactions(); }
  if (event.target.id === 'sort-filter') { state.sort = event.target.value; state.tablePage = 1; refreshTransactions(); }
  if (event.target.id === 'dark-mode') setTheme(event.target.checked);
  if (event.target.id === 'live-updates') { if (event.target.checked === state.paused) toggleStream(); }
});
document.addEventListener('submit', event => {
  if (event.target.id !== 'settings-form') return;
  event.preventDefault();
  const form = new FormData(event.target);
  const name = String(form.get('displayName')).trim(), workspace = String(form.get('workspaceName')).trim();
  if (!name || !workspace) return toast('Enter a display name and workspace name.');
  state.name = name; state.workspace = workspace; state.range = Number(form.get('range'));
  savePreference('name', name); savePreference('workspace', workspace); savePreference('range', state.range);
  $('#date-range').value = state.range; updateProfile(); toast('Preferences saved. Make yourself at home.');
});
document.addEventListener('pointerover', event => {
  const target = event.target.closest('[data-tooltip]');
  if (!target) return;
  const tooltip = $('.chart-tooltip'), container = $('.revenue-chart');
  if (!tooltip || !container) return;
  const [label, current, previous] = target.dataset.tooltip.split('|');
  tooltip.innerHTML = `${e(label)}<strong>${e(current)}</strong>Previous: ${e(previous)}`;
  const rect = target.getBoundingClientRect(), bounds = container.getBoundingClientRect();
  tooltip.style.left = `${Math.max(65, Math.min(bounds.width - 65, rect.x + rect.width / 2 - bounds.x))}px`;
  tooltip.style.top = '80px'; tooltip.hidden = false;
});
document.addEventListener('pointerout', event => { if (event.target.closest('[data-tooltip]') && $('.chart-tooltip')) $('.chart-tooltip').hidden = true; });
$('#date-range').addEventListener('change', async event => { state.range = Number(event.target.value); state.tablePage = 1; savePreference('range', state.range); await refresh(); });
$('.skip-link').addEventListener('click', event => { event.preventDefault(); $('#main').focus(); });
$('#theme-button').addEventListener('click', () => setTheme(document.documentElement.dataset.theme !== 'dark'));
$('#menu-button').addEventListener('click', () => { const open = !$('#sidebar').classList.contains('open'); $('#sidebar').classList.toggle('open', open); $('#mobile-scrim').classList.toggle('open', open); $('#menu-button').setAttribute('aria-expanded', String(open)); updateSidebarAccessibility(); if (open) $('#close-menu-button').focus(); });
$('#close-menu-button').addEventListener('click', closeMobileMenu);
$('#mobile-scrim').addEventListener('click', closeMobileMenu);
$('#profile-button').addEventListener('click', () => { location.hash = 'settings'; });
$('#top-profile-button').addEventListener('click', () => { location.hash = 'settings'; });
$('#workspace-info').addEventListener('click', () => { location.hash = 'settings'; });
$('#help-button').addEventListener('click', helpDialog);
$('#export-button').addEventListener('click', exportCSV);
$('#notification-button').addEventListener('click', () => { const panel = $('#notification-panel'); panel.hidden = !panel.hidden; $('#notification-button').setAttribute('aria-expanded', String(!panel.hidden)); if (!panel.hidden) renderNotifications(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeMobileMenu(); $('#notification-panel').hidden = true; $('#notification-button').setAttribute('aria-expanded', 'false'); } });
$('#detail-dialog').addEventListener('click', event => { if (event.target === $('#detail-dialog')) { const bounds = event.target.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.target.close(); } });
window.addEventListener('hashchange', navigate);
window.matchMedia('(max-width:780px)').addEventListener('change', updateSidebarAccessibility);
window.matchMedia('(max-width:600px)').addEventListener('change', () => { if (state.data && $('.chart-card')) $('.chart-card').outerHTML = chartHTML(); });
mountIcons(); updateProfile(); setTheme(readPreference('theme', 'light') === 'dark');
updateSidebarAccessibility();
$('#date-range').value = state.range;
async function boot() {
  try {
    const session = await getJSON('/api/session');
    if (session.authRequired && !session.authenticated) { location.replace('/login'); return; }
    state.mode = session.mode; state.authRequired = session.authRequired;
    $('.demo-badge').innerHTML = '<span class="small-dot"></span>' + modeText('Demo workspace','Secure workspace');
    $('#sign-out-button').hidden = !session.authRequired;
    if (session.authRequired) { state.name = readPreference('name', session.username); updateProfile(); $('.profile small').textContent = 'Signed in as ' + session.username; }
    await navigate(); connectStream();
    setInterval(() => { if (!document.hidden && !state.paused) refresh({full:false}); },15000);
  } catch(error) { showError(error.message); }
}
$('#sign-out-button').addEventListener('click',async()=>{
  try { const response=await fetch('/api/logout',{method:'POST'}); if(!response.ok) throw new Error('Unable to sign out. Try again.'); state.stream?.close(); location.replace('/login'); }
  catch(error) { toast(error.message); }
});
boot();

function productionPipelineHTML() {
  const connected=state.health?.services?.find(s=>s.name==='PostgreSQL')?.status==='connected';
  const nodes=[['arrows','API / Kafka','Authenticated ingestion'],['check','Validate','Schema and price checks'],['database','PostgreSQL','Durable transactions'],['chart','Dashboard','Authenticated analytics']];
  return `<div class="notice">${icon('info')}<span>Production ingestion accepts validated, immutable events. Identical transaction IDs are safe to retry. Conflicting data is rejected. Invalid Kafka messages are quarantined durably before their offsets are committed.</span></div><article class="card"><div class="card-header"><div><h2 class="card-title">From event to insight</h2><p class="card-subtitle">The supported production data path</p></div><button class="button" data-action="toggle-stream">${icon(state.paused?'play':'pause')}${state.paused?'Resume updates':'Pause updates'}</button></div><div class="pipeline-view"><div class="flow-track production-flow">${nodes.map(([symbol,name,description])=>`<div class="flow-node">${icon(symbol)}<strong>${name}</strong><small>${description}</small></div>`).join('')}</div><div class="pipeline-metrics"><div><span>PERSISTED RECORDS</span><strong>${number(state.data.totalRecords)}</strong><small>Validated warehouse transactions</small></div><div><span>UPDATE SOURCE</span><strong>Events</strong><small>Database notifications + refresh polling</small></div><div><span>DATA SOURCE</span><strong>PostgreSQL</strong><small>Indexed SQL aggregation</small></div></div></div></article><div class="analytics-grid" style="margin-top:23px"><article class="card"><div class="card-header"><div><h2 class="card-title">Service visibility</h2><p class="card-subtitle">Connection status reflects observed health</p></div></div><div class="service-list"><div class="service-row">${icon('database')}<div><strong>PostgreSQL</strong><p>Transaction storage and persistent sessions</p></div><span class="badge ${connected?'success':'failed'}">${connected?'Connected':'Unavailable'}</span></div><div class="service-row">${icon('arrows')}<div><strong>Kafka worker</strong><p>Optional deployment profile. Monitor consumer lag and worker logs.</p></div><span class="badge neutral">Not monitored here</span></div><div class="service-row">${icon('workflow')}<div><strong>Python / dbt / Airflow examples</strong><p>Legacy references, outside this production deployment.</p></div><span class="badge neutral">Reference</span></div></div></article><article class="card"><div class="card-header"><div><h2 class="card-title">Warehouse activity</h2><p class="card-subtitle">Change notifications received in this browser</p></div></div><div class="log-list">${logsHTML()}</div><div class="card-footer"><span>Latest 8 notifications</span><span>PostgreSQL</span></div></article></div>`;
}
function productionWarehouseHTML() {
  const fields=[['transaction_id','VARCHAR(100)','PRIMARY KEY'],['order_id','VARCHAR(120)','NOT NULL'],['customer_id','VARCHAR(100)','NOT NULL'],['customer_name','VARCHAR(200)','NOT NULL'],['customer_email','VARCHAR(254)','NOT NULL'],['product_id','BIGINT','NULLABLE'],['product_name','VARCHAR(200)','NOT NULL'],['category','VARCHAR(80)','NOT NULL'],['quantity','INTEGER','POSITIVE'],['unit_price','NUMERIC(14,2)','POSITIVE'],['total_amount','NUMERIC(14,2)','QUANTITY × UNIT PRICE'],['payment_method','VARCHAR(30)','CHECK'],['country','VARCHAR(100)','NOT NULL'],['status','VARCHAR(12)','CHECK'],['created_at','TIMESTAMPTZ','NOT NULL'],['ingested_at','TIMESTAMPTZ','NOT NULL'],['payload_hash','CHAR(64)','NOT NULL']];
  return `<section class="warehouse-banner"><div><h2>A durable home for every transaction.</h2><p>${number(state.data.totalRecords)} records persisted in PostgreSQL.<br>Validated events, exact decimal arithmetic, and managed schema migrations.</p></div>${icon('database')}</section><article class="card schema-card"><div class="card-header"><div><h2 class="card-title">commerce_transactions</h2><p class="card-subtitle">dashboard/migrations/001_initial.sql</p></div><span class="badge neutral">${fields.length} columns</span></div><div class="table-wrapper"><table aria-label="PostgreSQL commerce transactions schema"><thead><tr><th scope="col">Column</th><th scope="col">Type</th><th scope="col">Constraint</th></tr></thead><tbody>${fields.map(([name,type,constraint])=>`<tr><td><code>${name}</code></td><td>${type}</td><td><span class="badge neutral">${constraint}</span></td></tr>`).join('')}</tbody></table></div></article><div class="notice">${icon('info')}<span>Transaction IDs enforce idempotency. Monetary values use SQL decimals. Date, status, and category indexes support reporting. Backup, restore, retention, and access procedures are in PRODUCTION.md.</span></div>`;
}
