// Development-only authentication/SQL UI harness. Never included in the runtime image.
import { createApplication } from '../../server.mjs';
import { readConfig } from '../../config.mjs';
import { hashPassword } from '../../security.mjs';
import { normalizeTransaction } from '../../validation.mjs';
import { testDatabase } from './database.mjs';
const { repository } = await testDatabase();
const config = readConfig({ NODE_ENV: 'test', AUTH_ENABLED: 'true', ADMIN_USERNAME: 'preview', ADMIN_PASSWORD_HASH: await hashPassword('Preview-only-test-password'), APP_ORIGIN: 'http://localhost:3002' });
const now = Date.now();
await repository.ingest(Array.from({ length: 15 }, (_, i) => normalizeTransaction({ transaction_id: `preview-${i}`, order_id: `ORDER-${1000 + i}`, customer_id: `customer-${i}`, customer_name: 'Preview Customer', product_name: 'Studio Headphones', category: 'Electronics', quantity: 1, unit_price: 129, total_amount: 129, payment_method: 'card', country: 'United States', timestamp: new Date(now - i * 86400000 / 3 - 1000).toISOString() })));
const app = await createApplication({ config, repository, logger: () => {} });
await new Promise(resolve => app.server.listen(3002, '127.0.0.1', resolve));
console.log('Temporary UI test harness: http://localhost:3002 · PostgreSQL engine in WASM · fictional test records');
const stop = async () => { await app.close(); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
