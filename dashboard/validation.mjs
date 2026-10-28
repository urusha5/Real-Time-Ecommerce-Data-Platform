import { HttpError } from './security.mjs';
export const STATUSES = ['Completed', 'Pending', 'Failed'];
export const PAYMENTS = ['card', 'bank_transfer', 'mobile_money', 'cash'];
export function parseQuery(searchParams) {
  const allowed = new Set(['range', 'search', 'status', 'category', 'sort', 'page']);
  for (const key of searchParams.keys()) if (!allowed.has(key) || searchParams.getAll(key).length !== 1) throw new HttpError(400, 'Unknown or repeated query parameter.');
  const params = Object.fromEntries(searchParams);
  if (params.range !== undefined && !['1', '7', '30'].includes(params.range)) throw new HttpError(400, 'Reporting range must be 1, 7 or 30 days.');
  if (params.page !== undefined && (!/^[1-9]\d{0,6}$/.test(params.page))) throw new HttpError(400, 'Invalid page number.');
  if (params.status && !STATUSES.includes(params.status)) throw new HttpError(400, 'Invalid transaction status.');
  if (params.sort && !['newest', 'oldest', 'amount'].includes(params.sort)) throw new HttpError(400, 'Invalid sort order.');
  if ((params.search || '').length > 100 || (params.category || '').length > 80) throw new HttpError(400, 'Search or category is too long.');
  return { range: 7, page: 1, ...params };
}
function text(value, field, max, optional = false) {
  if (optional && (value === undefined || value === null || value === '')) return '';
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) throw new HttpError(422, `Invalid ${field}.`);
  return value.trim();
}
export function normalizeTransaction(input, now = Date.now()) {
  if (!input || Array.isArray(input) || typeof input !== 'object') throw new HttpError(422, 'A transaction must be an object.');
  const timestampInput = input.timestamp ?? input.created_at;
  if (typeof timestampInput !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)?$/.test(timestampInput)) throw new HttpError(422, 'timestamp must be an ISO 8601 date.');
  const [year, month, day, hour, minute, second] = timestampInput.slice(0, 19).split(/[-T:]/).map(Number);
  if (month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate() || hour > 23 || minute > 59 || second > 59) throw new HttpError(422, 'Invalid timestamp calendar date.');
  // Legacy Python events emit naive UTC timestamps; normalize them explicitly.
  const timestamp = /(?:Z|[+-]\d\d:\d\d)$/.test(timestampInput) ? timestampInput : timestampInput + 'Z';
  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed) || parsed > now + 300000 || parsed < Date.parse('2000-01-01')) throw new HttpError(422, 'timestamp is outside the accepted range.');
  const quantity = input.quantity, unitPrice = input.unit_price, amount = input.total_amount;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) throw new HttpError(422, 'quantity must be an integer from 1 to 10000.');
  for (const [field, value] of [['unit_price', unitPrice], ['total_amount', amount]]) if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > 10000000 || Math.abs(value * 100 - Math.round(value * 100)) > 0.00001) throw new HttpError(422, `${field} must be a positive USD amount with at most two decimals.`);
  if (Math.round(amount * 100) !== quantity * Math.round(unitPrice * 100)) throw new HttpError(422, 'total_amount must equal quantity multiplied by unit_price.');
  const status = input.status || 'Completed';
  if (!STATUSES.includes(status)) throw new HttpError(422, 'Invalid transaction status.');
  if (!PAYMENTS.includes(input.payment_method)) throw new HttpError(422, 'Invalid payment method.');
  const email = text(input.customer_email, 'customer_email', 254, true);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(422, 'Invalid customer_email.');
  const id = text(input.transaction_id, 'transaction_id', 100);
  const category = text(input.category, 'category', 80);
  const productId = input.product_id;
  if (productId !== undefined && (!Number.isSafeInteger(productId) || productId < 1)) throw new HttpError(422, 'product_id must be a positive integer.');
  return { transaction_id: id, order_id: text(input.order_id || `TX-${id}`, 'order_id', 120), customer_id: text(input.customer_id, 'customer_id', 100), customer_name: text(input.customer_name, 'customer_name', 200, true) || 'Customer', customer_email: email, product_id: productId || null, product_name: text(input.product_name, 'product_name', 200), category, quantity, unit_price: unitPrice, total_amount: amount, payment_method: input.payment_method, country: text(input.country, 'country', 100), timestamp: new Date(parsed).toISOString(), status };
}
export function presentation(category) {
  const map = { electronics: ['headphones', 'lavender'], fashion: ['bag', 'peach'], food: ['coffee', 'mint'], home: ['lamp', 'sand'], beauty: ['bottle', 'pink'], books: ['book', 'sand'], sports: ['layers', 'lavender'] };
  const [icon, color] = map[String(category).toLowerCase()] || ['bag', 'mint'];
  return { icon, color };
}
