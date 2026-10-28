import { randomUUID } from 'node:crypto';

export const PRODUCTS = [
  { id: 1001, name: 'Studio Headphones', category: 'Electronics', price: 129, icon: 'headphones', color: 'lavender' },
  { id: 1002, name: 'Everyday Sneakers', category: 'Fashion', price: 89, icon: 'shoe', color: 'peach' },
  { id: 1003, name: 'Ceramic Coffee Set', category: 'Home', price: 48, icon: 'coffee', color: 'sand' },
  { id: 1004, name: 'Smart Watch Series 4', category: 'Electronics', price: 189, icon: 'watch', color: 'mint' },
  { id: 1005, name: 'Daily Essentials Kit', category: 'Beauty', price: 36, icon: 'bottle', color: 'pink' },
  { id: 1006, name: 'Organic Matcha', category: 'Food', price: 24, icon: 'coffee', color: 'mint' },
  { id: 1007, name: 'Movement Yoga Mat', category: 'Sports', price: 42, icon: 'layers', color: 'lavender' },
  { id: 1008, name: 'The Design of Everyday Things', category: 'Books', price: 22, icon: 'book', color: 'sand' },
  { id: 1009, name: 'Linen Weekend Tote', category: 'Fashion', price: 34, icon: 'bag', color: 'peach' },
  { id: 1010, name: 'Minimal Desk Lamp', category: 'Home', price: 64, icon: 'lamp', color: 'sand' },
];
const PEOPLE = ['Olivia Rhye', 'Phoenix Baker', 'Lana Steiner', 'Demi Wilkinson', 'Drew Cano', 'Natali Craig', 'Andi Lane', 'Kate Morrison', 'Noah Williams', 'Mia Chen', 'James Wilson', 'Amara Okafor', 'Sofia Garcia', 'Liam Anderson', 'Ava Thompson', 'Ethan Taylor'];
const COUNTRIES = ['United States', 'United Kingdom', 'Germany', 'Nigeria', 'Canada', 'France'];
const PAYMENTS = ['card', 'card', 'card', 'bank_transfer', 'mobile_money', 'cash'];
const DAY = 86400000;
export const VALID_RANGES = [1, 7, 30];
export function parseRange(value) { return VALID_RANGES.includes(Number(value)) ? Number(value) : 7; }
export function createStore(now = Date.now()) {
  let seed = 4128;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const pick = list => list[Math.floor(random() * list.length)];
  const transactions = [];
  let sequence = 10842;
  function generate(timestamp, live = false) {
    const product = pick(PRODUCTS);
    const personIndex = Math.floor(random() * PEOPLE.length);
    const quantity = random() > .87 ? 2 : 1;
    const customerNumber = Math.floor(random() * 240) + 1;
    return {
      transaction_id: live ? randomUUID() : `demo-${sequence}`,
      order_id: `ORD-${sequence++}`,
      customer_id: `customer-${personIndex}-${customerNumber % 20}`,
      customer_name: PEOPLE[personIndex],
      customer_email: `${PEOPLE[personIndex].toLowerCase().replaceAll(' ', '.')}@example.com`,
      product_id: product.id, product_name: product.name, category: product.category,
      quantity, unit_price: product.price, total_amount: quantity * product.price,
      payment_method: pick(PAYMENTS), country: pick(COUNTRIES),
      timestamp: new Date(timestamp).toISOString(),
      status: random() > .12 ? 'Completed' : random() > .35 ? 'Pending' : 'Failed',
      icon: product.icon, color: product.color,
    };
  }
  for (let day = 59; day >= 0; day--) {
    const count = Math.round(58 + random() * 30 + (59 - day) * .35);
    for (let i = 0; i < count; i++) transactions.push(generate(now - day * DAY - random() * DAY));
  }
  transactions.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  function addTransaction() {
    const transaction = generate(Date.now(), true);
    transactions.unshift(transaction);
    // Keep the local demo bounded even when left running for a long time.
    if (transactions.length > 12000) transactions.length = 12000;
    return transaction;
  }
  return { transactions, addTransaction, startedAt: now };
}
export function selectTransactions(store, params = {}, now = Date.now()) {
  const days = parseRange(params.range);
  const start = now - days * DAY;
  const search = String(params.search || '').trim().toLowerCase();
  const status = ['Completed', 'Pending', 'Failed'].includes(params.status) ? params.status : '';
  const category = PRODUCTS.some(p => p.category === params.category) ? params.category : '';
  const rows = store.transactions.filter(t => Date.parse(t.timestamp) >= start && Date.parse(t.timestamp) <= now && (!status || t.status === status) && (!category || t.category === category) && (!search || [t.order_id, t.customer_name, t.customer_email, t.product_name, t.country, t.category].some(v => v.toLowerCase().includes(search))));
  const sort = ['amount', 'oldest', 'newest'].includes(params.sort) ? params.sort : 'newest';
  return sort === 'amount' ? rows.sort((a, b) => b.total_amount - a.total_amount) : sort === 'oldest' ? rows.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)) : rows;
}
const sumRevenue = rows => rows.filter(t => t.status === 'Completed').reduce((sum, t) => sum + t.total_amount, 0);
export function dashboard(store, range = 7, now = Date.now()) {
  const days = parseRange(range);
  const current = selectTransactions(store, { range: days }, now);
  const previous = store.transactions.filter(t => Date.parse(t.timestamp) >= now - days * DAY * 2 && Date.parse(t.timestamp) < now - days * DAY);
  function metrics(rows) {
    const completed = rows.filter(t => t.status === 'Completed');
    const revenue = sumRevenue(rows);
    return { revenue, orders: rows.length, average: completed.length ? revenue / completed.length : 0, customers: new Set(rows.map(t => t.customer_id)).size };
  }
  const stats = metrics(current), before = metrics(previous);
  const change = Object.fromEntries(Object.keys(stats).map(key => [key, before[key] ? (stats[key] - before[key]) / before[key] * 100 : null]));
  const buckets = days === 1 ? 12 : days;
  const interval = days * DAY / buckets;
  const series = Array.from({ length: buckets }, (_, i) => {
    const start = now - days * DAY + i * interval;
    const bucket = current.filter(t => Date.parse(t.timestamp) >= start && Date.parse(t.timestamp) < start + interval);
    return { timestamp: new Date(start + interval).toISOString(), ...metrics(bucket), previous: sumRevenue(previous.filter(t => Date.parse(t.timestamp) >= start - days * DAY && Date.parse(t.timestamp) < start - days * DAY + interval)) };
  });
  const categories = [...new Set(PRODUCTS.map(p => p.category))].map(name => ({ name, revenue: sumRevenue(current.filter(t => t.category === name)) })).sort((a, b) => b.revenue - a.revenue);
  const products = PRODUCTS.map(p => {
    const sold = current.filter(t => t.product_id === p.id && t.status === 'Completed');
    return { ...p, units: sold.reduce((n, t) => n + t.quantity, 0), revenue: sumRevenue(sold) };
  }).sort((a, b) => b.revenue - a.revenue);
  const countries = COUNTRIES.map(name => ({ name, orders: current.filter(t => t.country === name).length, revenue: sumRevenue(current.filter(t => t.country === name)) })).sort((a, b) => b.revenue - a.revenue);
  const payments = [...new Set(PAYMENTS)].map(name => ({ name, orders: current.filter(t => t.payment_method === name).length }));
  return { mode: 'demo', generatedAt: new Date(now).toISOString(), days, stats, change, series, categories, products, countries, payments, statusCounts: Object.fromEntries(['Completed', 'Pending', 'Failed'].map(s => [s, current.filter(t => t.status === s).length])), totalRecords: store.transactions.length };
}
export function toCSV(rows) {
  const columns = ['order_id', 'transaction_id', 'customer_name', 'customer_email', 'product_name', 'category', 'quantity', 'unit_price', 'total_amount', 'payment_method', 'country', 'status', 'timestamp'];
  const escape = value => { const text = String(value ?? ''); return `"${(/^[=+@\-\t\r\n]/.test(text) || /^\s+[=+@\-]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`; };
  return '\ufeff' + [columns.join(','), ...rows.map(row => columns.map(key => escape(row[key])).join(','))].join('\r\n');
}
