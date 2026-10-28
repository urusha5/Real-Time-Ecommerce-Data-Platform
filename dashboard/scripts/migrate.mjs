import { Pool } from 'pg';
import { readConfig } from '../config.mjs';
import { migrate } from '../repositories/postgres.mjs';
const config = readConfig();
if (config.mode !== 'postgres') throw new Error('Set DATA_MODE=postgres to run migrations.');
const pool = new Pool(config.database);
try {
  await migrate(pool);
  const role = process.env.DATABASE_APP_USER;
  if (role) {
    if (!/^[a-z_][a-z0-9_]{0,62}$/.test(role)) throw new Error('Invalid DATABASE_APP_USER.');
    await pool.query(`GRANT USAGE ON SCHEMA public TO "${role}"`);
    await pool.query(`GRANT SELECT, INSERT, DELETE ON commerce_transactions, commerce_sessions, commerce_dead_letters TO "${role}"`);
    await pool.query(`GRANT USAGE, SELECT ON SEQUENCE commerce_dead_letters_id_seq TO "${role}"`);
  }
  console.log(JSON.stringify({ event: 'migrations_complete' }));
} finally { await pool.end(); }
